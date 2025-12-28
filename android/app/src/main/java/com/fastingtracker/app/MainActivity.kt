package com.fastingtracker.app

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.provider.MediaStore
import android.util.Log
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import com.google.android.material.appbar.MaterialToolbar
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class MainActivity : AppCompatActivity() {
  private lateinit var webView: WebView
  private var filePathCallback: ValueCallback<Array<Uri>>? = null
  private var cameraImageUri: Uri? = null
  private var pendingChooser: (() -> Unit)? = null
  private val notificationPrefs by lazy { getSharedPreferences(NOTIFICATION_PREFS, MODE_PRIVATE) }

  private val fileChooserLauncher = registerForActivityResult(
    ActivityResultContracts.StartActivityForResult()
  ) { result ->
    val callback = filePathCallback
    filePathCallback = null

    if (callback == null) return@registerForActivityResult

    if (result.resultCode != RESULT_OK) {
      callback.onReceiveValue(null)
      cameraImageUri = null
      return@registerForActivityResult
    }

    val dataUri = result.data?.data
    val resultUri = dataUri ?: cameraImageUri
    callback.onReceiveValue(resultUri?.let { arrayOf(it) })
    cameraImageUri = null
  }

  private val cameraPermissionLauncher: ActivityResultLauncher<String> = registerForActivityResult(
    ActivityResultContracts.RequestPermission()
  ) { granted ->
    val launch = pendingChooser
    pendingChooser = null
    if (granted) {
      launch?.invoke()
    } else {
      launchGalleryOnly()
    }
  }

  private val notificationPermissionLauncher: ActivityResultLauncher<String> = registerForActivityResult(
    ActivityResultContracts.RequestPermission()
  ) { granted ->
    Log.d("FastFlow", "Notification permission result: $granted")
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContentView(R.layout.activity_main)

    val toolbar = findViewById<MaterialToolbar>(R.id.toolbar)
    setSupportActionBar(toolbar)
    toolbar.logo = ContextCompat.getDrawable(this, R.mipmap.ic_launcher)

    NotificationHelper.createChannel(this)
    requestPostNotificationsPermission(false)

    webView = findViewById(R.id.webview)

    webView.webChromeClient = object : WebChromeClient() {
      override fun onShowFileChooser(
        webView: WebView?,
        filePathCallback: ValueCallback<Array<Uri>>?,
        fileChooserParams: FileChooserParams?
      ): Boolean {
        this@MainActivity.filePathCallback?.onReceiveValue(null)
        this@MainActivity.filePathCallback = filePathCallback

        if (ContextCompat.checkSelfPermission(this@MainActivity, android.Manifest.permission.CAMERA)
          != android.content.pm.PackageManager.PERMISSION_GRANTED
        ) {
          pendingChooser = { launchChooserWithCamera() }
          cameraPermissionLauncher.launch(android.Manifest.permission.CAMERA)
          return true
        }

        launchChooserWithCamera()
        return true
      }
    }
    webView.webViewClient = WebViewClient()

    val settings = webView.settings
    settings.javaScriptEnabled = true
    settings.domStorageEnabled = true
    settings.allowFileAccess = true
    settings.allowContentAccess = true
    // Required for local ES module imports from file:// assets.
    settings.allowFileAccessFromFileURLs = true
    settings.allowUniversalAccessFromFileURLs = true

    webView.addJavascriptInterface(
      object {
        @android.webkit.JavascriptInterface
        fun update(stateJson: String?) {
          if (!stateJson.isNullOrBlank()) {
            val prefs = getSharedPreferences(WIDGET_PREFS, MODE_PRIVATE)
            prefs.edit().putString(WIDGET_STATE_KEY, stateJson).apply()
          }
          FastingWidgetScheduler.refreshAll(this@MainActivity)
          FastingWidgetScheduler.scheduleNext(this@MainActivity)
        }
      },
      "AndroidWidget"
    )

    webView.addJavascriptInterface(
      object {
        @android.webkit.JavascriptInterface
        fun startFastFromWidget() {
          runOnUiThread {
            webView.evaluateJavascript(
              "window.startFastFromExternal && window.startFastFromExternal()",
              null
            )
          }
        }

        @android.webkit.JavascriptInterface
        fun stopFastFromWidget() {
          runOnUiThread {
            webView.evaluateJavascript(
              "window.stopFastFromExternal && window.stopFastFromExternal()",
              null
            )
          }
        }
      },
      "NativeBridge"
    )

    webView.addJavascriptInterface(
      NotificationBridge(this, this),
      "AndroidNotifications"
    )

    webView.loadUrl("file:///android_asset/www/index.html")
    handleIntent(intent)

    onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
      override fun handleOnBackPressed() {
        if (webView.canGoBack()) {
          webView.goBack()
        } else {
          isEnabled = false
          onBackPressedDispatcher.onBackPressed()
        }
      }
    })
  }

  override fun onNewIntent(intent: Intent?) {
    super.onNewIntent(intent)
    handleIntent(intent)
  }

  private fun createTempImageFile(): File {
    val timestamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(Date())
    return File.createTempFile("fasting_${timestamp}_", ".jpg", cacheDir)
  }

  private fun launchChooserWithCamera() {
    val cameraIntent = Intent(MediaStore.ACTION_IMAGE_CAPTURE).takeIf { intent ->
      intent.resolveActivity(packageManager) != null
    }?.also { intent ->
      val photoFile = createTempImageFile()
      cameraImageUri = FileProvider.getUriForFile(
        this@MainActivity,
        "${BuildConfig.APPLICATION_ID}.fileprovider",
        photoFile
      )
      intent.putExtra(MediaStore.EXTRA_OUTPUT, cameraImageUri)
      intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
      intent.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION)
    }

    val galleryIntent = Intent(Intent.ACTION_GET_CONTENT).apply {
      type = "image/*"
      addCategory(Intent.CATEGORY_OPENABLE)
    }

    val chooser = Intent.createChooser(galleryIntent, "Select Image").apply {
      if (cameraIntent != null) {
        putExtra(Intent.EXTRA_INITIAL_INTENTS, arrayOf(cameraIntent))
      }
    }

    fileChooserLauncher.launch(chooser)
  }

  private fun launchGalleryOnly() {
    val galleryIntent = Intent(Intent.ACTION_GET_CONTENT).apply {
      type = "image/*"
      addCategory(Intent.CATEGORY_OPENABLE)
    }
    val chooser = Intent.createChooser(galleryIntent, "Select Image")
    fileChooserLauncher.launch(chooser)
  }

  private fun handleIntent(intent: Intent?) {
    when (intent?.action) {
      ACTION_START_FAST -> {
        webView.post {
          webView.evaluateJavascript("window.NativeBridge.startFastFromWidget()", null)
        }
      }
      ACTION_STOP_FAST -> {
        webView.post {
          webView.evaluateJavascript("window.NativeBridge.stopFastFromWidget()", null)
        }
      }
    }
  }

  fun requestPostNotificationsPermission(fromUserAction: Boolean) {
    if (android.os.Build.VERSION.SDK_INT < android.os.Build.VERSION_CODES.TIRAMISU) {
      return
    }

    val granted = ContextCompat.checkSelfPermission(
      this,
      android.Manifest.permission.POST_NOTIFICATIONS
    ) == android.content.pm.PackageManager.PERMISSION_GRANTED

    if (granted) {
      Log.d("FastFlow", "Notification permission already granted")
      return
    }

    val alreadyRequested = notificationPrefs.getBoolean(NOTIFICATION_REQUESTED_KEY, false)
    if (!alreadyRequested || fromUserAction) {
      notificationPrefs.edit().putBoolean(NOTIFICATION_REQUESTED_KEY, true).apply()
      Log.d("FastFlow", "Requesting notification permission")
      notificationPermissionLauncher.launch(android.Manifest.permission.POST_NOTIFICATIONS)
    }
  }

  companion object {
    private const val ACTION_START_FAST = "ACTION_START_FAST"
    private const val ACTION_STOP_FAST = "ACTION_STOP_FAST"
    private const val WIDGET_PREFS = "fasting_widget_state"
    private const val WIDGET_STATE_KEY = "widget_state_json"
    private const val NOTIFICATION_PREFS = "fastflow_notification_prefs"
    private const val NOTIFICATION_REQUESTED_KEY = "post_notifications_requested"
  }
}
