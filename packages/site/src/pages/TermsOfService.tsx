import { SEO } from "../components/SEO";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export function TermsOfService() {
  return (
    <>
      <SEO
        title="Terms of Service"
        description="Terms of Service for Locanara - On-device AI SDK for iOS and Android"
        path="/terms-of-service"
      />
      <div className="min-h-screen bg-background-primary dark:bg-background-dark">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-text-secondary dark:text-text-dark-secondary hover:text-accent transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <h1 className="text-4xl font-bold text-text-primary dark:text-text-dark-primary mb-2">
            Terms of Service
          </h1>
          <p className="text-text-secondary dark:text-text-dark-secondary mb-8">
            Locanara
          </p>

          <div className="prose prose-gray dark:prose-invert max-w-none [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-4 [&_h2]:text-text-primary [&_h2]:dark:text-text-dark-primary [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-text-primary [&_h3]:dark:text-text-dark-primary [&_p]:text-text-secondary [&_p]:dark:text-text-dark-secondary [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_li]:text-text-secondary [&_li]:dark:text-text-dark-secondary [&_li]:mb-2">
            <p>
              Welcome to Locanara. By using our services, you agree to be bound
              by these Terms of Service. Please read them carefully.
            </p>

            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing or using the Locanara SDK, website, or any related
              services (collectively, the "Service"), you agree to be bound by
              these Terms of Service. If you do not agree to these terms, please
              do not use our Service.
            </p>

            <h2>2. Description of Service</h2>
            <p>
              Locanara provides an on-device AI SDK for iOS and Android
              development. Our Service includes:
            </p>
            <ul>
              <li>On-device AI processing SDK</li>
              <li>Documentation and technical resources</li>
              <li>Community forum and support</li>
              <li>Access to open-source GitHub repositories</li>
            </ul>

            <h2>3. Account Registration</h2>

            <h3>Requirements</h3>
            <p>
              To access certain features, you must create an account. You agree
              to provide accurate, current, and complete information during
              registration.
            </p>

            <h3>Account Security</h3>
            <p>
              You are responsible for maintaining the security of your account
              credentials and for all activities that occur under your account.
              Notify us immediately of any unauthorized use.
            </p>

            <h2>4. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul>
              <li>
                Use the Service for any unlawful purpose or in violation of any
                applicable laws
              </li>
              <li>
                Reverse engineer, decompile, or disassemble the SDK except as
                permitted by law
              </li>
              <li>Share your account credentials with unauthorized users</li>
              <li>
                Attempt to circumvent any security measures or access controls
              </li>
              <li>Use the Service to develop competing products or services</li>
            </ul>

            <h2>5. Intellectual Property</h2>

            <h3>Our Rights</h3>
            <p>
              The Locanara SDK, documentation, website, and all related
              materials are owned by Locanara and protected by intellectual
              property laws. Your license to use the SDK is limited to the scope
              described in these terms.
            </p>

            <h3>Your Content</h3>
            <p>
              You retain ownership of any content you create using the SDK. By
              posting content on our community forum, you grant us a
              non-exclusive license to display and distribute that content
              within the Service.
            </p>

            <h2>6. Disclaimers</h2>
            <p>
              The Service is provided "as is" without warranties of any kind:
            </p>
            <ul>
              <li>
                We do not guarantee that the SDK will be error-free or
                uninterrupted
              </li>
              <li>
                AI features depend on device capabilities and may vary across
                devices
              </li>
              <li>
                Performance depends on the underlying platform (Apple
                Intelligence, Gemini Nano)
              </li>
              <li>
                We are not responsible for any third-party services or their
                availability
              </li>
            </ul>

            <h2>7. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Locanara shall not be
              liable for:
            </p>
            <ul>
              <li>
                Any indirect, incidental, special, consequential, or punitive
                damages
              </li>
              <li>Loss of profits, data, or business opportunities</li>
              <li>
                Any damages arising from your use or inability to use the
                Service
              </li>
              <li>
                Total liability shall not exceed the amount paid by you for the
                Service
              </li>
            </ul>

            <h2>8. Termination</h2>
            <p>
              We may suspend or terminate your access to the Service at any time
              for violation of these terms. Upon termination, your right to use
              the Service will immediately cease.
            </p>

            <h2>9. Changes to Terms</h2>
            <p>
              We may update these Terms of Service from time to time. We will
              notify users of any material changes by posting the updated terms
              on our website. Continued use of the Service after changes
              constitutes acceptance of the new terms.
            </p>

            <h2>10. Governing Law</h2>
            <p>
              These terms shall be governed by and construed in accordance with
              applicable laws, without regard to conflict of law principles.
            </p>

            <h2>11. Contact Us</h2>
            <p>
              If you have any questions about these Terms of Service, please
              contact us:
            </p>
            <p>
              <strong>Locanara</strong>
              <br />
              Email:{" "}
              <a
                href="mailto:hyo@hyo.dev"
                className="text-accent hover:underline"
              >
                hyo@hyo.dev
              </a>
              <br />
              Website:{" "}
              <a
                href="https://locanara.com"
                className="text-accent hover:underline"
              >
                https://locanara.com
              </a>
            </p>

            <p className="text-sm text-text-secondary dark:text-text-dark-secondary mt-8">
              Last updated: January 2025
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
