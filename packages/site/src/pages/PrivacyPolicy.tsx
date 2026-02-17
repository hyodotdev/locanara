import { SEO } from "../components/SEO";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export function PrivacyPolicy() {
  return (
    <>
      <SEO
        title="Privacy Policy"
        description="Privacy Policy for Locanara - On-device AI SDK for iOS and Android"
        path="/privacy-policy"
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
            Privacy Policy
          </h1>
          <p className="text-text-secondary dark:text-text-dark-secondary mb-8">
            Locanara
          </p>

          <div className="prose prose-gray dark:prose-invert max-w-none [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-4 [&_h2]:text-text-primary [&_h2]:dark:text-text-dark-primary [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-text-primary [&_h3]:dark:text-text-dark-primary [&_p]:text-text-secondary [&_p]:dark:text-text-dark-secondary [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_li]:text-text-secondary [&_li]:dark:text-text-dark-secondary [&_li]:mb-2">
            <p>
              At Locanara, we are committed to protecting your privacy. This
              Privacy Policy explains how we collect, use, and safeguard your
              information when you use our services.
            </p>

            <h2>1. Information We Collect</h2>

            <h3>Account Information</h3>
            <p>When you create an account, we collect:</p>
            <ul>
              <li>Email address</li>
              <li>Display name</li>
              <li>Profile information (optional)</li>
              <li>Authentication data from GitHub OAuth</li>
            </ul>
            <p>
              This information is necessary to provide you with access to our
              services and manage your account.
            </p>

            <h3>Usage Data</h3>
            <p>We may collect information about how you use our services:</p>
            <ul>
              <li>Pages visited and features used</li>
              <li>Community forum posts and comments</li>
              <li>Feature requests and votes</li>
            </ul>

            <h3>Technical Data</h3>
            <p>We automatically collect certain technical information:</p>
            <ul>
              <li>Browser type and version</li>
              <li>Device type and operating system</li>
              <li>IP address</li>
              <li>Cookies and similar technologies</li>
            </ul>

            <h2>2. On-Device AI Processing</h2>
            <p>
              <strong>
                The Locanara SDK processes all AI operations entirely on-device.
              </strong>{" "}
              This is a core principle of our service:
            </p>
            <ul>
              <li>
                No user data is sent to external servers for AI processing
              </li>
              <li>
                All text processing, summarization, and analysis happens locally
              </li>
              <li>
                We do not have access to the data processed by the SDK on your
                users' devices
              </li>
              <li>
                The SDK does not require an internet connection for AI features
              </li>
            </ul>
            <p>
              This privacy-first approach ensures that sensitive data never
              leaves the device.
            </p>

            <h2>3. How We Use Your Information</h2>
            <p>We use the collected information to:</p>
            <ul>
              <li>Provide and maintain our services</li>
              <li>Manage your account and grant repository access</li>
              <li>Send important service updates and announcements</li>
              <li>Respond to your inquiries and support requests</li>
              <li>Improve our services and develop new features</li>
              <li>Detect and prevent fraud or abuse</li>
            </ul>

            <h2>4. Third-Party Services</h2>

            <h3>Convex</h3>
            <p>
              We use Convex as our backend database. Your account and community
              data is stored on Convex's secure infrastructure:
            </p>
            <ul>
              <li>Data is encrypted in transit and at rest</li>
              <li>Convex complies with industry-standard security practices</li>
            </ul>

            <h3>GitHub</h3>
            <p>
              We use GitHub for authentication and repository access. When you
              sign in with GitHub:
            </p>
            <ul>
              <li>
                We receive your public profile information and email address
              </li>
              <li>Users are granted access to open-source repositories</li>
              <li>
                We do not access your private repositories or code unless
                explicitly granted
              </li>
            </ul>

            <h2>5. Data Sharing</h2>
            <p>We do not sell your personal information. We may share data:</p>
            <ul>
              <li>With your consent</li>
              <li>To comply with legal obligations</li>
              <li>
                With service providers who assist in operating our services
              </li>
              <li>
                In connection with a merger, acquisition, or sale of assets
              </li>
            </ul>

            <h2>6. Data Security</h2>
            <p>
              We implement appropriate security measures to protect your
              information:
            </p>
            <ul>
              <li>HTTPS encryption for all data in transit</li>
              <li>Secure authentication using industry-standard protocols</li>
              <li>Regular security reviews and updates</li>
              <li>Limited access to personal data on a need-to-know basis</li>
            </ul>

            <h2>7. Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access your personal data</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your account and data</li>
              <li>Export your data in a portable format</li>
              <li>Opt out of marketing communications</li>
            </ul>
            <p>
              To exercise these rights, please contact us at{" "}
              <a
                href="mailto:hyo@hyo.dev"
                className="text-accent hover:underline"
              >
                hyo@hyo.dev
              </a>
              .
            </p>

            <h2>8. Cookies</h2>
            <p>
              We use cookies and similar technologies to maintain your session
              and remember your preferences. You can configure your browser to
              refuse cookies, though this may limit some functionality.
            </p>

            <h2>9. Children's Privacy</h2>
            <p>
              Our services are not directed to children under 13. We do not
              knowingly collect information from children under 13. If you
              believe we have collected such information, please contact us
              immediately.
            </p>

            <h2>10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy periodically. We will notify you
              of significant changes by posting the updated policy on our
              website. Your continued use of our services after changes
              constitutes acceptance of the updated policy.
            </p>

            <h2>11. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please
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
