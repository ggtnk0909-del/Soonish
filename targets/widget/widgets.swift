import WidgetKit
import SwiftUI
import AppIntents

// MARK: - App Group constants

private let appGroupID = "group.com.hidet.soonish"

// MARK: - Settings read from App Group UserDefaults

private struct SoonishSettings {
    let offsetMinutes: Int
    let mode: String      // "fixed" or "fuzzy"
    let fuzz: Int         // pre-computed daily fuzz, only used when mode == "fuzzy"

    static func load() -> SoonishSettings {
        let defaults = UserDefaults(suiteName: appGroupID)
        let offset = defaults?.integer(forKey: "offsetMinutes") ?? 5
        let mode   = defaults?.string(forKey: "mode") ?? "fixed"
        let fuzz   = defaults?.integer(forKey: "fuzz") ?? 0
        // integer(forKey:) returns 0 when key is missing — treat 0 offset as default 5
        return SoonishSettings(
            offsetMinutes: offset == 0 ? 5 : offset,
            mode: mode,
            fuzz: fuzz
        )
    }

    var totalMinutes: Int {
        mode == "fuzzy" ? offsetMinutes + fuzz : offsetMinutes
    }
}

// MARK: - AppIntent (required for iOS 26+)

struct SoonishWidgetIntent: WidgetConfigurationIntent {
    static let title: LocalizedStringResource = "Soonish"
    static let description = IntentDescription("少し先の時刻を表示して遅刻を防ぎます。")
}

// MARK: - Timeline entry

struct SoonishEntry: TimelineEntry {
    let date: Date          // system time of this entry
    let displayTime: Date   // offset time to show
}

// MARK: - Timeline provider

struct SoonishProvider: AppIntentTimelineProvider {
    typealias Intent = SoonishWidgetIntent

    func placeholder(in context: Context) -> SoonishEntry {
        let now = Date()
        return SoonishEntry(date: now, displayTime: now.addingTimeInterval(10 * 60))
    }

    func snapshot(for configuration: SoonishWidgetIntent, in context: Context) async -> SoonishEntry {
        let now = Date()
        let settings = SoonishSettings.load()
        let display = now.addingTimeInterval(Double(settings.totalMinutes) * 60)
        return SoonishEntry(date: now, displayTime: display)
    }

    func timeline(for configuration: SoonishWidgetIntent, in context: Context) async -> Timeline<SoonishEntry> {
        let settings = SoonishSettings.load()
        let now = Date()
        var entries: [SoonishEntry] = []

        // Generate 1 entry per minute for 60 minutes (max 60 entries)
        for minuteOffset in 0..<60 {
            let entryDate = Calendar.current.date(
                byAdding: .minute, value: minuteOffset, to: now
            )!
            let displayDate = entryDate.addingTimeInterval(Double(settings.totalMinutes) * 60)
            entries.append(SoonishEntry(date: entryDate, displayTime: displayDate))
        }

        // Reload after 1 hour
        let reloadDate = Calendar.current.date(byAdding: .hour, value: 1, to: now)!
        return Timeline(entries: entries, policy: .after(reloadDate))
    }
}

// MARK: - Widget view

private let timeFormatter: DateFormatter = {
    let f = DateFormatter()
    f.dateFormat = "HH:mm"
    return f
}()

struct SoonishWidgetView: View {
    var entry: SoonishEntry

    var body: some View {
        Text(timeFormatter.string(from: entry.displayTime))
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
        .description("少し先の時刻を表示して遅刻を防ぎます。")
        .supportedFamilies([
            .systemSmall,
            .accessoryCircular,   // lock screen
            .accessoryRectangular // lock screen
        ])
    }
}
