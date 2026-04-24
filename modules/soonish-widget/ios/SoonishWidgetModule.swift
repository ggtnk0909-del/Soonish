import ExpoModulesCore
import WidgetKit

private let appGroupID = "group.com.hidet.soonish"

public class SoonishWidgetModule: Module {
  public func definition() -> ModuleDefinition {
    Name("SoonishWidget")

    // saveSettings(args: { offsetMinutes, mode, fuzz, slotsJSON })
    AsyncFunction("saveSettings") { (args: [String: Any]) throws in
      guard let defaults = UserDefaults(suiteName: appGroupID) else {
        let msg = String(format: NSLocalizedString("error.appGroupNotFound", comment: ""), appGroupID)
        throw Exception(name: "AppGroupError", description: msg)
      }

      if let offset = args["offsetMinutes"] as? Int {
        defaults.set(offset, forKey: "offsetMinutes")
      }
      if let mode = args["mode"] as? String {
        defaults.set(mode, forKey: "mode")
      }
      if let fuzz = args["fuzz"] as? Int {
        defaults.set(fuzz, forKey: "fuzz")
      }
      if let slotsJSON = args["slotsJSON"] as? String {
        defaults.set(slotsJSON, forKey: "slotsJSON")
      }
      if let departureHour = args["departureHour"] as? Int {
        defaults.set(departureHour, forKey: "departureHour")
      }
      if let departureMinute = args["departureMinute"] as? Int {
        defaults.set(departureMinute, forKey: "departureMinute")
      }
      if let fuzzMax = args["fuzzMax"] as? Int {
        defaults.set(fuzzMax, forKey: "fuzzMax")
      }
      if let todayNotifyTime = args["todayNotifyTime"] as? String {
        defaults.set(todayNotifyTime, forKey: "todayNotifyTime")
      }
      if let schedulesJSON = args["schedulesJSON"] as? String {
        defaults.set(schedulesJSON, forKey: "schedulesJSON")
      }

      defaults.synchronize()
      WidgetCenter.shared.reloadAllTimelines()
    }

    // loadSettings() -> { offsetMinutes, mode, fuzz, isInitialized }
    AsyncFunction("loadSettings") { () -> [String: Any] in
      guard let defaults = UserDefaults(suiteName: appGroupID) else {
        return ["isInitialized": false, "offsetMinutes": 10, "mode": "fixed", "fuzz": 0]
      }
      let isInitialized = defaults.object(forKey: "schedulesJSON") != nil
      return [
        "isInitialized": isInitialized,
        "schedulesJSON": defaults.string(forKey: "schedulesJSON") as Any,
        "todayNotifyTime": defaults.string(forKey: "todayNotifyTime") as Any,
      ]
    }
  }
}
