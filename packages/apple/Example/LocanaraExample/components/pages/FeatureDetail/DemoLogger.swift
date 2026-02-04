import Foundation
import Locanara

/// Demo logging helper for debugging
/// Prints input, parameters, and results in a copy-paste friendly format
enum DemoLogger {

    /// Log feature execution input
    static func logInput(feature: String, input: String, parameters: Any?) {
        print("")
        print("========== \(feature) INPUT ==========")
        print("Input Text:")
        print(input)
        print("")
        if let params = parameters {
            print("Parameters:")
            print(String(describing: params))
        }
        print("=======================================")
        print("")
    }

    /// Log feature execution result
    static func logResult<T>(feature: String, result: T) {
        print("")
        print("========== \(feature) RESULT ==========")
        print(String(describing: result))
        print("========================================")
        print("")
    }

    /// Log feature execution error
    static func logError(feature: String, error: Error) {
        print("")
        print("========== \(feature) ERROR ==========")
        print("Error: \(error.localizedDescription)")
        if let locanaraError = error as? LocanaraError {
            print("LocanaraError: \(locanaraError)")
        }
        print("=======================================")
        print("")
    }

    /// Log raw ExecuteFeatureInput for debugging
    static func logExecuteInput(_ input: ExecuteFeatureInput) {
        print("")
        print("========== ExecuteFeatureInput ==========")
        print("Feature: \(input.feature.rawValue)")
        print("Input: \(input.input)")
        if let params = input.parameters {
            print("Parameters: \(params)")
        }
        print("==========================================")
        print("")
    }
}
