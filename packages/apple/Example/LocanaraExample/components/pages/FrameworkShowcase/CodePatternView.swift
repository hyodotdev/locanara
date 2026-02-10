import SwiftUI

/// Displays a collapsible code snippet showing the framework API pattern
struct CodePatternView: View {
    let code: String
    @State private var isExpanded = true

    var body: some View {
        DisclosureGroup("Code Pattern", isExpanded: $isExpanded) {
            ScrollView(.horizontal, showsIndicators: false) {
                Text(code)
                    .font(.system(.caption, design: .monospaced))
                    .padding(12)
            }
            .background(Color.gray.opacity(0.15))
            .clipShape(RoundedRectangle(cornerRadius: 8))
        }
        .font(.headline)
    }
}
