plugins {
  id("com.android.application")
  id("org.jetbrains.kotlin.android")
}

android {
  namespace = "com.fastingtracker.app"
  compileSdk = 34

  defaultConfig {
    applicationId = "com.fastingtracker.app"
    minSdk = 24
    targetSdk = 34
    versionCode = 1
    versionName = "1.0.0"
  }

  signingConfigs {
    create("release") {
      storeFile = file("../keystore/fastflow-release.keystore")
      storePassword = System.getenv("FASTFLOW_KEYSTORE_PASSWORD")
      keyAlias = "fastflow-key"
      keyPassword = System.getenv("FASTFLOW_KEY_PASSWORD")
    }
  }

  buildTypes {
    release {
      signingConfig = signingConfigs.getByName("release")
      isMinifyEnabled = false
      proguardFiles(
        getDefaultProguardFile("proguard-android-optimize.txt"),
        "proguard-rules.pro"
      )
    }
  }

  buildFeatures {
    viewBinding = true
    buildConfig = true
  }

  compileOptions {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
  }

  kotlinOptions {
    jvmTarget = "17"
  }
}

dependencies {
  implementation("androidx.core:core-ktx:1.12.0")
  implementation("androidx.appcompat:appcompat:1.6.1")
  implementation("com.google.android.material:material:1.11.0")
  implementation("androidx.work:work-runtime-ktx:2.9.0")
}
