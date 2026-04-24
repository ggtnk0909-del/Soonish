import ExpoModulesCore
import WidgetKit

private let appGroupID = "group.com.hidet.soonish"

public class SoonishWidgetModule: Module {
  public func definition() -> ModuleDefinition {
    Name("SoonishWidget")

    // saveSettings(args: { offsetMinutes, mode, fuzz, slotsJSON })
    AsyncFunction("saveSettings") { (args: [String: Any]) throws in
      guard let defaults = UserDefaults(suiteName: appGroupID) else {
        throw Exception(name: "AppGroupError", description: "App Group '\(appGroupID)' が設定されていません。Xcode で App Group capability を追加してください。")
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

      defaults.synchronize()
      WidgetCenter.shared.reloadAllTimelines()
    }

    // loadSettings() -> { offsetMinutes, mode, fuzz, isInitialized }
    AsyncFunction("loadSettings") { () -> [String: Any] in
      guard let defaults = UserDefaults(suiteName: appGroupID) else {
        return ["isInitialized": false, "offsetMinutes": 10, "mode": "fixed", "fuzz": 0]
      }
      let isInitialized = defaults.object(forKey: "offsetMinutes") != nil
      let offset = defaults.integer(forKey: "offsetMinutes")
      let mode   = defaults.string(forKey: "mode") ?? "fixed"
      let fuzz   = defaults.integer(forKey: "fuzz")
      return [
        "isInitialized": isInitialized,
        "offsetMinutes": isInitialized ? offset : 10,
        "mode": mode,
        "fuzz": fuzz,
      ]
    }
  }
}
