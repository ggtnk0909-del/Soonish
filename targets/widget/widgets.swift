import WidgetKit
import SwiftUI
import AppIntents

// MARK: - App Group constants

private let appGroupID = "group.com.hidet.soonish"

// MARK: - Settings read from App Group UserDefaults

private struct SoonishSettings {
    let todayNotifyTime: String?  // "HH:mm" format, nil if not set

    static func load() -> SoonishSettings {
        let defaults = UserDefaults(suiteName: appGroupID)
        return SoonishSettings(
            todayNotifyTime: defaults?.string(forKey: "todayNotifyTime")
        )
    }
}

// MARK: - AppIntent (required for iOS 26+)

struct SoonishWidgetIntent: WidgetConfigurationIntent {
    static let title: LocalizedStringResource = "Soonish"
    static let description = IntentDescription(LocalizedStringResource("widget.description", table: "Localizable"))
}

// MARK: - Timeline entry

struct SoonishEntry: TimelineEntry {
    let date: Date
    let notifyTimeText: String  // "HH:mm" or placeholder
}

// MARK: - Timeline provider

struct SoonishProvider: AppIntentTimelineProvider {
    typealias Intent = SoonishWidgetIntent

    func placeholder(in context: Context) -> SoonishEntry {
        SoonishEntry(date: Date(), notifyTimeText: "07:10")
    }

    func snapshot(for configuration: SoonishWidgetIntent, in context: Context) async -> SoonishEntry {
        let settings = SoonishSettings.load()
        return SoonishEntry(date: Date(), notifyTimeText: settings.todayNotifyTime ?? "--:--")
    }

    func timeline(for configuration: SoonishWidgetIntent, in context: Context) async -> Timeline<SoonishEntry> {
        let settings = SoonishSettings.load()
        let entry = SoonishEntry(date: Date(), notifyTimeText: settings.todayNotifyTime ?? "--:--")
        // Reload at midnight to pick up next day's notification time
        let midnight = Calendar.current.startOfDay(for: Calendar.current.date(byAdding: .day, value: 1, to: Date())!)
        return Timeline(entries: [entry], policy: .after(midnight))
    }
}

// MARK: - Widget view

struct SoonishWidgetView: View {
    var entry: SoonishEntry

    var body: some View {
        Text(entry.notifyTimeText)
            .font(.system(size: 48, weight: .thin, design: .rounded))
            .minimumScaleFactor(0.5)
            .containerBackground(.background, for: .widget)
    }
}

// MARK: - Widget configuration

struct SoonishWidget: Widget {
    let kind = "SoonishWidget"

    var body: some WidgetConfiguration {
        AppIntentConfiguration(kind: kind, intent: SoonishWidgetIntent.self, provider: SoonishProvider()) { entry in
            SoonishWidgetView(entry: entry)
        }
        .configurationDisplayName("Soonish")
        .description(LocalizedStringResource("widget.description", table: "Localizable"))
        .supportedFamilies([
            .systemSmall,
            .accessoryCircular,   // lock screen
            .accessoryRectangular // lock screen
        ])
    }
}
