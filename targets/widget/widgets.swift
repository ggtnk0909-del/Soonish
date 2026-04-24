import WidgetKit
import SwiftUI
import AppIntents

// MARK: - App Group constants

private let appGroupID = "group.com.hidet.soonish"

// MARK: - Schedule Entity

struct ScheduleEntity: AppEntity {
    let id: String
    let displayName: String

    static var typeDisplayRepresentation = TypeDisplayRepresentation(name: "スケジュール")
    static var defaultQuery = ScheduleEntityQuery()

    var displayRepresentation: DisplayRepresentation {
        DisplayRepresentation(title: "\(displayName)")
    }
}

struct ScheduleEntityQuery: EntityQuery {
    func entities(for identifiers: [String]) async throws -> [ScheduleEntity] {
        allEntities().filter { identifiers.contains($0.id) }
    }

    func suggestedEntities() async throws -> [ScheduleEntity] {
        allEntities()
    }

    private func allEntities() -> [ScheduleEntity] {
        guard let defaults = UserDefaults(suiteName: appGroupID),
              let json = defaults.string(forKey: "schedulesJSON"),
              let data = json.data(using: .utf8),
              let schedules = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]]
        else { return [] }
        return schedules.compactMap { parseEntity($0) }
    }

    private func parseEntity(_ s: [String: Any]) -> ScheduleEntity? {
        guard let id = s["id"] as? String else { return nil }
        let hour   = s["departureHour"]   as? Int ?? 0
        let minute = s["departureMinute"] as? Int ?? 0
        let weekdays = (s["weekdays"] as? [Int] ?? []).sorted()
        let dayNames = ["日","月","火","水","木","金","土"]
        let dayStr = weekdays.compactMap { $0 < dayNames.count ? dayNames[$0] : nil }.joined(separator: "・")
        let name = String(format: "%02d:%02d（%@）", hour, minute, dayStr)
        return ScheduleEntity(id: id, displayName: name)
    }
}

// MARK: - Helpers

private func loadSchedules() -> [[String: Any]] {
    guard let defaults = UserDefaults(suiteName: appGroupID),
          let json = defaults.string(forKey: "schedulesJSON"),
          let data = json.data(using: .utf8),
          let schedules = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]]
    else { return [] }
    return schedules
}

private func calcNotifyTime(from s: [String: Any]) -> String? {
    guard let hour   = s["departureHour"]   as? Int,
          let minute = s["departureMinute"] as? Int,
          let offset = s["offsetMinutes"]   as? Int
    else { return nil }
    let total    = hour * 60 + minute - offset
    let adjusted = ((total % 1440) + 1440) % 1440
    return String(format: "%02d:%02d", adjusted / 60, adjusted % 60)
}

// MARK: - AppIntent

struct SoonishWidgetIntent: WidgetConfigurationIntent {
    static let title: LocalizedStringResource = "Soonish"
    static let description = IntentDescription(LocalizedStringResource("widget.description", table: "Localizable"))

    @Parameter(title: LocalizedStringResource("widget.selectSchedule", table: "Localizable"))
    var schedule: ScheduleEntity?
}

// MARK: - Timeline entry

struct SoonishEntry: TimelineEntry {
    let date: Date
    let notifyTimeText: String
    let subtitleText: String?
}

// MARK: - Timeline provider

struct SoonishProvider: AppIntentTimelineProvider {
    typealias Intent = SoonishWidgetIntent

    func placeholder(in context: Context) -> SoonishEntry {
        let label = String(format: NSLocalizedString("widget.offsetLabel", tableName: "Localizable", comment: ""), 20)
        return SoonishEntry(date: Date(), notifyTimeText: "07:10", subtitleText: label)
    }

    func snapshot(for configuration: SoonishWidgetIntent, in context: Context) async -> SoonishEntry {
        makeEntry(for: configuration)
    }

    func timeline(for configuration: SoonishWidgetIntent, in context: Context) async -> Timeline<SoonishEntry> {
        let entry = makeEntry(for: configuration)
        let midnight = Calendar.current.startOfDay(
            for: Calendar.current.date(byAdding: .day, value: 1, to: Date())!
        )
        return Timeline(entries: [entry], policy: .after(midnight))
    }

    private func makeEntry(for configuration: SoonishWidgetIntent) -> SoonishEntry {
        let (time, offset) = resolveInfo(for: configuration)
        let subtitle = offset.map {
            String(format: NSLocalizedString("widget.offsetLabel", tableName: "Localizable", comment: ""), $0)
        }
        return SoonishEntry(date: Date(), notifyTimeText: time, subtitleText: subtitle)
    }

    private func resolveInfo(for configuration: SoonishWidgetIntent) -> (time: String, offset: Int?) {
        let schedules = loadSchedules()

        // 選択されたスケジュールがあればその通知時刻を表示
        if let selectedID = configuration.schedule?.id,
           let s = schedules.first(where: { ($0["id"] as? String) == selectedID }),
           let time = calcNotifyTime(from: s) {
            let offset = s["offsetMinutes"] as? Int
            return (time, offset)
        }

        // Swift .weekday は 1=日〜7=土 → 0-indexed に変換
        let swiftWeekday = Calendar.current.component(.weekday, from: Date())
        let todayJS = swiftWeekday - 1  // 0=日, 1=月, ..., 6=土

        // 今日から7日先まで順に探して最初に見つかったスケジュールの通知時刻を返す
        for dayOffset in 0..<7 {
            let weekday = (todayJS + dayOffset) % 7
            let match = schedules
                .filter { ($0["weekdays"] as? [Int] ?? []).contains(weekday) }
                .compactMap { s -> (String, Int)? in
                    guard let time = calcNotifyTime(from: s),
                          let offset = s["offsetMinutes"] as? Int else { return nil }
                    return (time, offset)
                }
                .sorted { $0.0 < $1.0 }
                .first
            if let (time, offset) = match {
                return (time, offset)
            }
        }

        return ("--:--", nil)
    }
}

// MARK: - Widget view

struct SoonishWidgetView: View {
    var entry: SoonishEntry
    @Environment(\.widgetFamily) var family

    var body: some View {
        VStack(spacing: 2) {
            Text(entry.notifyTimeText)
                .font(.system(size: 48, weight: .thin, design: .rounded))
                .minimumScaleFactor(0.5)
            if let subtitle = entry.subtitleText,
               family == .systemSmall || family == .accessoryRectangular {
                Text(subtitle)
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
        }
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
            .accessoryCircular,
            .accessoryRectangular
        ])
    }
}
