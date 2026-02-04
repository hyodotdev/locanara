import SwiftUI

/// Generic info row with label and value
struct InfoRow: View {
    let label: String
    let value: String
    var valueColor: Color = .primary

    var body: some View {
        HStack {
            Text(label)
                .foregroundStyle(.secondary)
            Spacer()
            Text(value)
                .foregroundStyle(valueColor)
        }
    }
}

#Preview {
    List {
        InfoRow(label: "Version", value: "1.0.0")
        InfoRow(label: "Status", value: "Active", valueColor: .green)
        InfoRow(label: "Error", value: "Failed", valueColor: .red)
    }
}
