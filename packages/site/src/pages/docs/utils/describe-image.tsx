import { Link } from "react-router-dom";
import AnchorLink from "../../../components/docs/AnchorLink";
import CodeBlock from "../../../components/docs/CodeBlock";
import LanguageTabs from "../../../components/docs/LanguageTabs";
import PageNavigation from "../../../components/docs/PageNavigation";
import { SEO } from "../../../components/SEO";
import TLDRBox from "../../../components/docs/TLDRBox";

function DescribeImageAPI() {
  return (
    <div className="doc-page">
      <SEO
        title="Describe Image API"
        description="describeImage - built-in image description using on-device AI for accessibility and content analysis."
        path="/docs/utils/describe-image"
        keywords="describe image, image description, accessibility, alt text, on-device AI"
      />
      <h1>describeImage()</h1>
      <p style={{ color: "var(--text-secondary)", marginTop: "-0.5rem" }}>
        Low-level API (not yet available as a built-in chain)
      </p>
      <p>
        Generate text descriptions of images using on-device AI. Useful for
        accessibility (alt text), content analysis, and image understanding.
      </p>

      <TLDRBox>
        <ul>
          <li>
            <strong>iOS</strong>: Apple Intelligence (iOS 26+) with llama.cpp
            fallback for older devices
          </li>
          <li>
            <strong>Android</strong>: Gemini Nano via ML Kit
          </li>
          <li>
            <strong>Input</strong>: Base64 encoded image or file path
          </li>
          <li>
            <strong>Use cases</strong>: Alt text, content moderation, image
            search
          </li>
        </ul>
      </TLDRBox>

      <section>
        <AnchorLink id="signature" level="h2">
          Signature
        </AnchorLink>
        <LanguageTabs>
          {{
            swift: (
              <CodeBlock language="swift">{`func describeImage(
    input: String,  // Description context or empty string
    parameters: ImageDescriptionParametersInput
) async throws -> ImageDescriptionResult

struct ImageDescriptionParametersInput {
    let imageBase64: String?  // Base64 encoded image data
    let imagePath: String?    // Path to image file
}`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`suspend fun describeImage(
    input: String,  // Description context or empty string
    parameters: ImageDescriptionParametersInput
): ImageDescriptionResult

data class ImageDescriptionParametersInput(
    val imageBase64: String? = null,  // Base64 encoded image data
    val imagePath: String? = null     // Path to image file
)`}</CodeBlock>
            ),
            typescript: (
              <CodeBlock language="typescript">{`async function describeImage(
  input: string,  // Description context or empty string
  parameters: ImageDescriptionParametersInput
): Promise<ImageDescriptionResult>

interface ImageDescriptionParametersInput {
  imageBase64?: string;  // Base64 encoded image data
  imagePath?: string;    // Path to image file
}`}</CodeBlock>
            ),
            dart: (
              <CodeBlock language="dart">{`Future<ImageDescriptionResult> describeImage(
  String input, {  // Description context or empty string
  required ImageDescriptionParametersInput parameters,
});

class ImageDescriptionParametersInput {
  final String? imageBase64;  // Base64 encoded image data
  final String? imagePath;    // Path to image file
}`}</CodeBlock>
            ),
          }}
        </LanguageTabs>
      </section>

      <section>
        <AnchorLink id="result" level="h2">
          Result
        </AnchorLink>
        <LanguageTabs>
          {{
            swift: (
              <CodeBlock language="swift">{`struct ImageDescriptionResult {
    let description: String       // Generated description
    let alternatives: [String]?   // Alternative descriptions
    let confidence: Double?       // Confidence score (0.0 - 1.0)
}`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`data class ImageDescriptionResult(
    val description: String,       // Generated description
    val alternatives: List<String>?, // Alternative descriptions
    val confidence: Double?        // Confidence score (0.0 - 1.0)
)`}</CodeBlock>
            ),
            typescript: (
              <CodeBlock language="typescript">{`interface ImageDescriptionResult {
  description: string;       // Generated description
  alternatives?: string[];   // Alternative descriptions
  confidence?: number;       // Confidence score (0.0 - 1.0)
}`}</CodeBlock>
            ),
            dart: (
              <CodeBlock language="dart">{`class ImageDescriptionResult {
  final String description;       // Generated description
  final List<String>? alternatives; // Alternative descriptions
  final double? confidence;       // Confidence score (0.0 - 1.0)
}`}</CodeBlock>
            ),
          }}
        </LanguageTabs>
      </section>

      <section>
        <AnchorLink id="example-base64" level="h2">
          Example (Base64)
        </AnchorLink>
        <LanguageTabs>
          {{
            swift: (
              <CodeBlock language="swift">{`import Locanara
import UIKit

// Load image and convert to base64
let image = UIImage(named: "photo")!
let imageData = image.jpegData(compressionQuality: 0.8)!
let base64String = imageData.base64EncodedString()

// Describe the image
let result = try await LocanaraClient.shared.executeFeature(
    ExecuteFeatureInput(
        feature: .describeImage,
        input: "",  // Optional context
        parameters: FeatureParametersInput(
            imageDescription: ImageDescriptionParametersInput(
                imageBase64: base64String
            )
        )
    )
)

if case .imageDescription(let description) = result.result {
    print(description.description)
    // Output: "A golden retriever sitting on a green lawn in a sunny backyard,
    //          with a red ball nearby and trees in the background."
}`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`import com.locanara.Locanara
import android.graphics.Bitmap
import android.util.Base64
import java.io.ByteArrayOutputStream

// Load image and convert to base64
val bitmap = BitmapFactory.decodeResource(resources, R.drawable.photo)
val outputStream = ByteArrayOutputStream()
bitmap.compress(Bitmap.CompressFormat.JPEG, 80, outputStream)
val base64String = Base64.encodeToString(outputStream.toByteArray(), Base64.DEFAULT)

// Describe the image
val result = locanara.executeFeature(
    ExecuteFeatureInput(
        feature = FeatureType.DESCRIBE_IMAGE,
        input = "",  // Optional context
        parameters = FeatureParametersInput(
            imageDescription = ImageDescriptionParametersInput(
                imageBase64 = base64String
            )
        )
    )
)

val description = result.result?.imageDescription
println(description?.description)
// Output: "A golden retriever sitting on a green lawn in a sunny backyard,
//          with a red ball nearby and trees in the background."`}</CodeBlock>
            ),
            typescript: (
              <CodeBlock language="typescript">{`import { Locanara } from 'react-native-locanara';
import RNFS from 'react-native-fs';

// Read image and convert to base64
const base64String = await RNFS.readFile(imagePath, 'base64');

// Describe the image
const result = await Locanara.describeImage({
  input: '',  // Optional context
  parameters: {
    imageBase64: base64String,
  },
});

console.log(result.description);
// Output: "A golden retriever sitting on a green lawn in a sunny backyard,
//          with a red ball nearby and trees in the background."`}</CodeBlock>
            ),
            dart: (
              <CodeBlock language="dart">{`import 'package:flutter_locanara/flutter_locanara.dart';
import 'dart:convert';
import 'dart:io';

// Read image and convert to base64
final bytes = await File(imagePath).readAsBytes();
final base64String = base64Encode(bytes);

// Describe the image
final result = await Locanara.describeImage(
  input: '',  // Optional context
  parameters: ImageDescriptionParametersInput(
    imageBase64: base64String,
  ),
);

print(result.description);
// Output: "A golden retriever sitting on a green lawn in a sunny backyard,
//          with a red ball nearby and trees in the background."`}</CodeBlock>
            ),
          }}
        </LanguageTabs>
      </section>

      <section>
        <AnchorLink id="platform-notes" level="h2">
          Platform Notes
        </AnchorLink>

        <h4>iOS</h4>
        <ul>
          <li>Uses Apple Intelligence (iOS 26+) for image understanding</li>
          <li>llama.cpp fallback available for older devices</li>
          <li>Supports various image formats (JPEG, PNG, HEIC)</li>
        </ul>

        <h4>Android</h4>
        <ul>
          <li>Uses Gemini Nano via ML Kit for image description</li>
          <li>
            Platform-specific <code>describeImageAndroid()</code> API also
            available
          </li>
          <li>Supports various image formats (JPEG, PNG, WebP)</li>
        </ul>

        <div className="alert-card alert-card--info">
          <p>
            <strong>Tip:</strong> For best results, use well-lit images with
            clear subjects. Maximum recommended image size is 4096x4096 pixels.
          </p>
        </div>
      </section>

      <p className="type-link">
        See:{" "}
        <Link to="/docs/types#image-description-result">
          ImageDescriptionResult
        </Link>
        , <Link to="/docs/utils">All Utils</Link>
      </p>

      <PageNavigation
        prev={{ to: "/docs/utils/proofread", label: "proofread()" }}
        next={{ to: "/docs/utils/ios", label: "iOS APIs" }}
      />
    </div>
  );
}

export default DescribeImageAPI;
