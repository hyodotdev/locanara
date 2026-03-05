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
    dependencies: [
        // LocalLLMClient - llama.cpp wrapper for on-device LLM inference
        .package(url: "https://github.com/tattn/LocalLLMClient.git", branch: "main"),
    ],
    targets: [
        .target(
            name: "Locanara",
            dependencies: [
                .product(name: "LocalLLMClient", package: "LocalLLMClient"),
                .product(name: "LocalLLMClientLlama", package: "LocalLLMClient"),
            ],
            path: "Sources",
            swiftSettings: [
                .swiftLanguageMode(.v5),
                .interoperabilityMode(.Cxx),
            ]),
        .testTarget(
            name: "LocanaraTests",
            dependencies: ["Locanara"],
            path: "Tests",
            swiftSettings: [
                .swiftLanguageMode(.v5),
                .interoperabilityMode(.Cxx),
            ]),
    ]
)
