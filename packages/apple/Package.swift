// swift-tools-version: 6.0

import PackageDescription

let package = Package(
    name: "Locanara",
    platforms: [
        .iOS(.v17),
        .macOS(.v14),
        .tvOS(.v17),
        .watchOS(.v10)
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
