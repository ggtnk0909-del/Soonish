import WidgetKit
import SwiftUI

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

// MARK: - Timeline entry

struct SoonishEntry: TimelineEntry {
    let date: Date          // system time of this entry
    let displayTime: Date   // offset time to show
}

// MARK: - Timeline provider

struct SoonishProvider: TimelineProvider {
    func placeholder(in context: Context) -> SoonishEntry {
        let now = Date()
        return SoonishEntry(date: now, displayTime: now.addingTimeInterval(10 * 60))
    }

    func getSnapshot(in context: Context, completion: @escaping (SoonishEntry) -> Void) {
        let now = Date()
        let settings = SoonishSettings.load()
        let display = now.addingTimeInterval(Double(settings.totalMinutes) * 60)
        completion(SoonishEntry(date: now, displayTime: display))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<SoonishEntry>) -> Void) {
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
        let timeline = Timeline(entries: entries, policy: .after(reloadDate))
        completion(timeline)
    }
}

// MARK: - Widget view

struct SoonishWidgetView: View {
    var entry: SoonishEntry

    var body: some View {
        VStack(spacing: 2) {
            Text(entry.displayTime, style: .time)
                .font(.system(size: 48, weight: .thin, design: .rounded))
                .minimumScaleFactor(0.6)
        }
        .containerBackground(.background, for: .widget)
    }
}

// MARK: - Widget configuration

struct SoonishWidget: Widget {
    let kind = "SoonishWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: SoonishProvider()) { entry in
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
