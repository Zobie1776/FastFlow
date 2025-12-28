package com.fastingtracker.app

import android.content.Context
import androidx.work.Worker
import androidx.work.WorkerParameters

/**
 * Periodic worker fallback for widget updates.
 */
class FastingWidgetUpdateWorker(
  context: Context,
  params: WorkerParameters
) : Worker(context, params) {
  /**
   * Perform the widget refresh.
   */
  override fun doWork(): Result {
    FastingWidgetScheduler.refreshAll(applicationContext)
    FastingWidgetScheduler.scheduleNext(applicationContext)
    return Result.success()
  }
}
