import Foundation

/// Debug logging for ExpoOndeviceAi module development
/// Configure via app.config.ts: `plugins: [["expo-ondevice-ai", { enableNativeLogging: true }]]`
enum ExpoOndeviceAiLog {
    /// Read logging preference from Info.plist (set via Expo config plugin)
    private static var enabled: Bool = {
        let rawValue = Bundle.main.object(forInfoDictionaryKey: "ExpoOndeviceAiEnableLogging")
        print("[ExpoOndeviceAi] Raw Info.plist value: \(String(describing: rawValue)), type: \(type(of: rawValue))")

        // Try Bool first
        if let boolValue = rawValue as? Bool {
            print("[ExpoOndeviceAi] Logging enabled (Bool): \(boolValue)")
            return boolValue
        }
        // Try NSNumber (plist stores booleans as NSNumber)
        if let numValue = rawValue as? NSNumber {
            let result = numValue.boolValue
            print("[ExpoOndeviceAi] Logging enabled (NSNumber): \(result)")
            return result
        }
        print("[ExpoOndeviceAi] Logging disabled (no valid value found)")
        return false
    }()

    private static let tag = "[ExpoOndeviceAi]"

    static func d(_ message: String) {
        guard enabled else { return }
        print("\(tag) \(message)")
    }

    static func d(_ message: String, _ items: Any...) {
        guard enabled else { return }
        let itemsStr = items.map { String(describing: $0) }.joined(separator: ", ")
        print("\(tag) \(message) \(itemsStr)")
    }

    static func error(_ message: String) {
        guard enabled else { return }
        print("\(tag) ERROR: \(message)")
    }

    static func json(_ label: String, _ dict: [String: Any]) {
        guard enabled else { return }
        if let data = try? JSONSerialization.data(withJSONObject: dict, options: .prettyPrinted),
           let jsonStr = String(data: data, encoding: .utf8) {
            print("\(tag) \(label):\n\(jsonStr)")
        } else {
            print("\(tag) \(label): \(dict)")
        }
    }
}
