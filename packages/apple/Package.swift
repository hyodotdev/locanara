// swift-tools-version: 6.0

import PackageDescription

let package = Package(
    name: "Locanara",
    // Note: SDK compiles on older platforms but Apple Intelligence features
    // require iOS 26+/macOS 26+ at runtime (checked via #available)
    platforms: [
        .iOS(.v15),
        .macOS(.v14),
        .tvOS(.v15),
        .watchOS(.v8)
    ],
    products: [
        .library(
            name: "Locanara",
            targets: ["Locanara"]),
    ],
    dependencies: [],
    targets: [
        .target(
            name: "Locanara",
            path: "Sources",
            swiftSettings: [
                .swiftLanguageMode(.v5)
            ]),
        .testTarget(
            name: "LocanaraTests",
            dependencies: ["Locanara"],
            path: "Tests",
            swiftSettings: [
                .swiftLanguageMode(.v5)
            ]),
    ]
)
