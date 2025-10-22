/**
 * ============================================================================
 * SAFETY COORDINATOR WELCOME EMAIL - ENHANCED VERSION
 * ============================================================================
 *
 * This script automatically sends a professional welcome email when someone
 * submits the Safety Coordinator Google Form.
 *
 * FEATURES:
 * - Enhanced professional design with safety badge header
 * - Prominent two-column contact card (Phone | Email)
 * - Comprehensive safety services list with checkmarks
 * - Professional signature with FP monogram badge
 * - Email tracking to prevent duplicate sends
 * - Mobile-responsive design
 *
 * SETUP INSTRUCTIONS:
 * 1. Open your Google Spreadsheet (linked to your form)
 * 2. Go to Extensions > Apps Script
 * 3. Replace all code with this script
 * 4. Save (Ctrl/Cmd + S)
 * 5. Run setupTrigger() function (select from dropdown, click Run ▶️)
 * 6. Authorize when prompted
 * 7. Test with sendTestEmail() function
 *
 * Version: 2.0 Enhanced
 * Last Updated: January 2025
 * ============================================================================
 */

// ============================================================================
// CONFIGURATION - CUSTOMIZE THESE SETTINGS
// ============================================================================

const EMAIL_CONFIG = {
  // Email settings
  fromEmail: "safety@customworkforcesolutionsllc.com",
  fromName: "Fabien Perdomo - Custom Workforce Solutions",
  subject: "Welcome! Your DFW Safety Coordinator is Here to Help",

  // Column indices (A=1, B=2, C=3, etc.)
  emailColumnIndex: 3,      // Column C = Email Address
  nameColumnIndex: 2,       // Column B = Full Name

  // Features
  trackEmailsSent: true,    // Add "Email Sent" column tracking

  // Contact information
  phoneNumber: "469-853-1980",
  phoneNumberFormatted: "469-853-1980",
  email: "safety@customworkforcesolutionsllc.com"
};

// ============================================================================
// MAIN FUNCTION - TRIGGERS ON FORM SUBMISSION
// ============================================================================

/**
 * Main function that runs when form is submitted
 * This is triggered automatically by the onFormSubmit trigger
 */
function onFormSubmit(e) {
  try {
    Logger.log('=== Form submission detected ===');

    // Get the active sheet and row information
    const sheet = e.source.getActiveSheet();
    const row = e.range.getRow();

    Logger.log(`Processing row: ${row}`);

    // Get recipient information
    const emailAddress = sheet.getRange(row, EMAIL_CONFIG.emailColumnIndex).getValue();
    const recipientName = sheet.getRange(row, EMAIL_CONFIG.nameColumnIndex).getValue();

    Logger.log(`Email: ${emailAddress}`);
    Logger.log(`Name: ${recipientName}`);

    // Validation
    if (!emailAddress || !isValidEmail(emailAddress)) {
      Logger.log('ERROR: Invalid or missing email address');
      throw new Error('Invalid or missing email address in column ' + EMAIL_CONFIG.emailColumnIndex);
    }

    if (!recipientName) {
      Logger.log('WARNING: Missing recipient name, will use generic greeting');
    }

    // Check if email was already sent (if tracking is enabled)
    if (EMAIL_CONFIG.trackEmailsSent) {
      const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      let emailSentColumnIndex = headers.indexOf("Email Sent") + 1;

      // Create "Email Sent" column if it doesn't exist
      if (emailSentColumnIndex === 0) {
        emailSentColumnIndex = sheet.getLastColumn() + 1;
        sheet.getRange(1, emailSentColumnIndex).setValue("Email Sent");
      }

      // Check if email was already sent for this row
      const emailSentValue = sheet.getRange(row, emailSentColumnIndex).getValue();
      if (emailSentValue === "Yes" || emailSentValue === "TRUE" || emailSentValue === true) {
        Logger.log('Email already sent for this submission. Skipping.');
        return;
      }
    }

    // Generate email content
    const htmlBody = generateEnhancedEmailHTML(recipientName);
    const plainTextBody = generatePlainTextVersion(recipientName);

    // Send the email
    Logger.log('Sending email...');
    GmailApp.sendEmail(
      emailAddress,
      EMAIL_CONFIG.subject,
      plainTextBody,
      {
        name: EMAIL_CONFIG.fromName,
        replyTo: EMAIL_CONFIG.fromEmail || Session.getActiveUser().getEmail(),
        htmlBody: htmlBody
      }
    );

    Logger.log('✅ Email sent successfully!');

    // Mark as sent in spreadsheet
    if (EMAIL_CONFIG.trackEmailsSent) {
      const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      const emailSentColumnIndex = headers.indexOf("Email Sent") + 1;

      sheet.getRange(row, emailSentColumnIndex).setValue("Yes");
      sheet.getRange(row, emailSentColumnIndex + 1).setValue(new Date());

      // Set header for timestamp column if needed
      if (!sheet.getRange(1, emailSentColumnIndex + 1).getValue()) {
        sheet.getRange(1, emailSentColumnIndex + 1).setValue("Email Sent Date");
      }
    }

    Logger.log('=== Process completed successfully ===');

  } catch (error) {
    Logger.log('❌ ERROR: ' + error.toString());

    // Send error notification to yourself
    const userEmail = Session.getActiveUser().getEmail();
    GmailApp.sendEmail(
      userEmail,
      'Error: Safety Coordinator Welcome Email Failed',
      `An error occurred while sending the welcome email:\n\nError: ${error.toString()}\n\nRow: ${e.range.getRow()}\n\nPlease check the script execution log for details.`
    );

    throw error;
  }
}

// ============================================================================
// EMAIL TEMPLATE - ENHANCED PROFESSIONAL DESIGN
// ============================================================================

/**
 * Generates the enhanced HTML email content
 * @param {string} recipientName - Name of the recipient
 * @return {string} HTML email content
 */
function generateEnhancedEmailHTML(recipientName) {
  const greeting = recipientName ? recipientName : "there";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Safety Coordinator Welcome Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #e8e8e8;">

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #e8e8e8; padding: 20px 0;">
    <tr>
      <td align="center">

        <!-- Main Email Container -->
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.15); max-width: 600px;">

          <!-- ENHANCED HEADER with Safety Badge -->
          <tr>
            <td style="background: linear-gradient(135deg, #2c3544 0%, #1a2332 100%); padding: 40px 30px; text-align: center; position: relative;">

              <!-- Safety Excellence Badge -->
              <table cellpadding="0" cellspacing="0" role="presentation" align="center" style="margin-bottom: 20px;">
                <tr>
                  <td style="background-color: #FF6B00; width: 70px; height: 70px; border-radius: 50%; text-align: center; vertical-align: middle; border: 4px solid rgba(255, 255, 255, 0.2);">
                    <div style="font-size: 36px; line-height: 70px; color: #ffffff;">⭐</div>
                  </td>
                </tr>
              </table>

              <h1 style="color: #ffffff; margin: 0 0 10px 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                Welcome to Safety Excellence
              </h1>
              <p style="color: #e6e6e6; margin: 0; font-size: 18px; font-weight: 400;">
                Custom Workforce Solutions LLC
              </p>

              <!-- Orange accent divider -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top: 20px;">
                <tr>
                  <td align="center">
                    <div style="width: 80px; height: 3px; background-color: #FF6B00; border-radius: 2px;"></div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- PROMINENT TWO-COLUMN CONTACT INFORMATION CARD -->
          <tr>
            <td style="padding: 0 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top: -30px; background: linear-gradient(135deg, #FF6B00 0%, #FF8C00 100%); border-radius: 10px; box-shadow: 0 6px 20px rgba(255, 107, 0, 0.3);">
                <tr>
                  <td style="padding: 25px 30px;">
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <!-- Phone Number Column -->
                        <td width="50%" style="padding-right: 15px; border-right: 2px solid rgba(255, 255, 255, 0.3);">
                          <div style="text-align: center;">
                            <div style="font-size: 24px; margin-bottom: 5px;">☎</div>
                            <div style="color: #ffffff; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px;">
                              Call or Text
                            </div>
                            <a href="tel:+1${EMAIL_CONFIG.phoneNumber.replace(/-/g, '')}" style="color: #ffffff; font-size: 22px; font-weight: 700; text-decoration: none; display: block; letter-spacing: 0.5px;">
                              ${EMAIL_CONFIG.phoneNumberFormatted}
                            </a>
                          </div>
                        </td>

                        <!-- Email Column -->
                        <td width="50%" style="padding-left: 15px;">
                          <div style="text-align: center;">
                            <div style="font-size: 24px; margin-bottom: 5px;">✉️</div>
                            <div style="color: #ffffff; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px;">
                              Email Me
                            </div>
                            <a href="mailto:${EMAIL_CONFIG.email}" style="color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; display: block; word-break: break-word; line-height: 1.3;">
                              ${EMAIL_CONFIG.email}
                            </a>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- GREETING SECTION with Enhanced Typography -->
          <tr>
            <td style="padding: 50px 40px 30px 40px;">
              <h2 style="color: #1a2332; margin: 0 0 25px 0; font-size: 26px; font-weight: 600; line-height: 1.3;">
                Hi ${greeting},
              </h2>

              <p style="color: #333333; line-height: 1.8; font-size: 17px; margin: 0 0 20px 0;">
                Thank you for reaching out! My name is <strong style="color: #1a2332;">Fabien Perdomo</strong>, and I am your
                <strong style="color: #FF6B00; background-color: #FFF8F0; padding: 2px 8px; border-radius: 4px; white-space: nowrap;">DFW Safety Coordinator</strong>.
              </p>

              <p style="color: #333333; line-height: 1.8; font-size: 17px; margin: 0;">
                I am committed to maintaining a safe environment for all our associates and your facilities. Safety is not just a priority—it's a
                <strong style="color: #1a2332;">core value</strong> that protects everyone.
              </p>
            </td>
          </tr>

          <!-- ENHANCED SERVICES SECTION with Visual Icons -->
          <tr>
            <td style="padding: 20px 40px;">

              <!-- Services Container with Shadow -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #f8f9fa; border: 2px solid #FF6B00; border-radius: 10px; overflow: hidden;">

                <!-- Services Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #1a2332 0%, #2c3544 100%); padding: 20px 25px;">
                    <h3 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; text-align: center;">
                      ⭐ Comprehensive Safety Services
                    </h3>
                  </td>
                </tr>

                <!-- Services List -->
                <tr>
                  <td style="padding: 25px 30px;">
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">

                      <!-- Service Item 1 -->
                      <tr>
                        <td style="padding: 12px 0;">
                          <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
                            <tr>
                              <td width="40" valign="top">
                                <table cellpadding="0" cellspacing="0" role="presentation">
                                  <tr>
                                    <td style="width: 28px; height: 28px; background: linear-gradient(135deg, #FF6B00, #FF8C00); border-radius: 50%; text-align: center; vertical-align: middle;">
                                      <span style="color: #ffffff; font-size: 16px; font-weight: bold; line-height: 28px;">✓</span>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                              <td style="color: #1a2332; font-size: 16px; font-weight: 500; line-height: 1.5;">
                                Safety Talks & Training Sessions
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <!-- Service Item 2 -->
                      <tr>
                        <td style="padding: 12px 0;">
                          <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
                            <tr>
                              <td width="40" valign="top">
                                <table cellpadding="0" cellspacing="0" role="presentation">
                                  <tr>
                                    <td style="width: 28px; height: 28px; background: linear-gradient(135deg, #FF6B00, #FF8C00); border-radius: 50%; text-align: center; vertical-align: middle;">
                                      <span style="color: #ffffff; font-size: 16px; font-weight: bold; line-height: 28px;">✓</span>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                              <td style="color: #1a2332; font-size: 16px; font-weight: 500; line-height: 1.5;">
                                Safety Raffles & Engagement Activities
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <!-- Service Item 3 -->
                      <tr>
                        <td style="padding: 12px 0;">
                          <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
                            <tr>
                              <td width="40" valign="top">
                                <table cellpadding="0" cellspacing="0" role="presentation">
                                  <tr>
                                    <td style="width: 28px; height: 28px; background: linear-gradient(135deg, #FF6B00, #FF8C00); border-radius: 50%; text-align: center; vertical-align: middle;">
                                      <span style="color: #ffffff; font-size: 16px; font-weight: bold; line-height: 28px;">✓</span>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                              <td style="color: #1a2332; font-size: 16px; font-weight: 500; line-height: 1.5;">
                                Safety Quizzes & Assessments
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <!-- Service Item 4 -->
                      <tr>
                        <td style="padding: 12px 0;">
                          <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
                            <tr>
                              <td width="40" valign="top">
                                <table cellpadding="0" cellspacing="0" role="presentation">
                                  <tr>
                                    <td style="width: 28px; height: 28px; background: linear-gradient(135deg, #FF6B00, #FF8C00); border-radius: 50%; text-align: center; vertical-align: middle;">
                                      <span style="color: #ffffff; font-size: 16px; font-weight: bold; line-height: 28px;">✓</span>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                              <td style="color: #1a2332; font-size: 16px; font-weight: 500; line-height: 1.5;">
                                Personal Protective Equipment (PPE) Support
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <!-- Service Item 5 -->
                      <tr>
                        <td style="padding: 12px 0;">
                          <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
                            <tr>
                              <td width="40" valign="top">
                                <table cellpadding="0" cellspacing="0" role="presentation">
                                  <tr>
                                    <td style="width: 28px; height: 28px; background: linear-gradient(135deg, #FF6B00, #FF8C00); border-radius: 50%; text-align: center; vertical-align: middle;">
                                      <span style="color: #ffffff; font-size: 16px; font-weight: bold; line-height: 28px;">✓</span>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                              <td style="color: #1a2332; font-size: 16px; font-weight: 500; line-height: 1.5;">
                                Safety Reinforcement Programs
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <!-- Service Item 6 -->
                      <tr>
                        <td style="padding: 12px 0 0 0;">
                          <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
                            <tr>
                              <td width="40" valign="top">
                                <table cellpadding="0" cellspacing="0" role="presentation">
                                  <tr>
                                    <td style="width: 28px; height: 28px; background: linear-gradient(135deg, #FF6B00, #FF8C00); border-radius: 50%; text-align: center; vertical-align: middle;">
                                      <span style="color: #ffffff; font-size: 16px; font-weight: bold; line-height: 28px;">✓</span>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                              <td style="color: #1a2332; font-size: 16px; font-weight: 500; line-height: 1.5;">
                                Emergency Protocol Training & Response Planning
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                    </table>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- EMERGENCY AVAILABILITY CALLOUT -->
          <tr>
            <td style="padding: 30px 40px 20px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background: linear-gradient(135deg, #FFF8F0 0%, #FFEFE0 100%); border-left: 5px solid #FF6B00; border-radius: 8px;">
                <tr>
                  <td style="padding: 20px 25px;">
                    <p style="color: #1a2332; font-size: 16px; line-height: 1.7; margin: 0; font-weight: 500;">
                      <strong style="color: #FF6B00; font-size: 18px;">⚡ Available When You Need Me</strong><br><br>
                      Whether you need immediate assistance, have questions, or would like to schedule any of these services, please don't hesitate to reach out. I'm here to support you and ensure we maintain the highest safety standards.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ENHANCED CALL-TO-ACTION BUTTONS -->
          <tr>
            <td style="padding: 20px 40px 40px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <!-- Call Button -->
                  <td width="48%" style="padding-right: 2%;">
                    <a href="tel:+1${EMAIL_CONFIG.phoneNumber.replace(/-/g, '')}" style="display: block; background: linear-gradient(135deg, #1a2332 0%, #2c3544 100%); color: #ffffff; text-decoration: none; padding: 18px 20px; border-radius: 8px; font-size: 16px; font-weight: 700; text-align: center; box-shadow: 0 4px 12px rgba(26, 35, 50, 0.3); border: 2px solid #FF6B00;">
                      ☎ Call Me Now
                    </a>
                  </td>

                  <!-- Email Button -->
                  <td width="48%" style="padding-left: 2%;">
                    <a href="mailto:${EMAIL_CONFIG.email}" style="display: block; background: linear-gradient(135deg, #FF6B00 0%, #FF8C00 100%); color: #ffffff; text-decoration: none; padding: 18px 20px; border-radius: 8px; font-size: 16px; font-weight: 700; text-align: center; box-shadow: 0 4px 12px rgba(255, 107, 0, 0.4);">
                      ✉️ Email Me
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- PROFESSIONAL SIGNATURE SECTION -->
          <tr>
            <td style="padding: 35px 40px; background: linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%); border-top: 3px solid #e9ecef;">

              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td>
                    <p style="color: #1a2332; margin: 0 0 20px 0; font-size: 18px; font-weight: 600; line-height: 1.4;">
                      Looking forward to working with you!
                    </p>

                    <table cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="padding-right: 20px; border-right: 3px solid #FF6B00;">
                          <!-- Signature Badge -->
                          <table cellpadding="0" cellspacing="0" role="presentation">
                            <tr>
                              <td style="width: 60px; height: 60px; background: linear-gradient(135deg, #FF6B00, #FF8C00); border-radius: 8px; text-align: center; vertical-align: middle; font-size: 28px; color: #ffffff; font-weight: bold; box-shadow: 0 3px 10px rgba(255, 107, 0, 0.3);">
                                FP
                              </td>
                            </tr>
                          </table>
                        </td>
                        <td style="padding-left: 20px;">
                          <p style="margin: 0; line-height: 1.7;">
                            <strong style="color: #FF6B00; font-size: 19px; display: block; margin-bottom: 4px;">Fabien Perdomo</strong>
                            <span style="color: #1a2332; font-size: 15px; font-weight: 600; display: block;">DFW Safety Coordinator</span>
                            <span style="color: #6c757d; font-size: 15px; font-weight: 500;">Custom Workforce Solutions LLC</span>
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- Contact Info Repeat -->
                    <table cellpadding="0" cellspacing="0" role="presentation" style="margin-top: 20px; background-color: #ffffff; padding: 15px 20px; border-radius: 6px; border: 1px solid #e9ecef;">
                      <tr>
                        <td style="padding-right: 20px;">
                          <a href="tel:+1${EMAIL_CONFIG.phoneNumber.replace(/-/g, '')}" style="color: #FF6B00; text-decoration: none; font-size: 15px; font-weight: 600;">
                            ☎ ${EMAIL_CONFIG.phoneNumberFormatted}
                          </a>
                        </td>
                        <td style="padding-left: 20px; border-left: 2px solid #e9ecef;">
                          <a href="mailto:${EMAIL_CONFIG.email}" style="color: #FF6B00; text-decoration: none; font-size: 15px; font-weight: 600; word-break: break-all;">
                            ✉️ ${EMAIL_CONFIG.email}
                          </a>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- FOOTER with Trust Elements -->
          <tr>
            <td style="padding: 25px 40px; background: linear-gradient(135deg, #1a2332 0%, #2c3544 100%); text-align: center;">

              <p style="color: #FF6B00; margin: 0 0 10px 0; font-size: 14px; font-weight: 700; letter-spacing: 0.5px;">
                ⭐ YOUR SAFETY IS MY PRIORITY
              </p>

              <p style="color: #b0b8c0; margin: 0 0 8px 0; font-size: 13px; line-height: 1.6;">
                This is an automated welcome message.
              </p>

              <p style="color: #b0b8c0; margin: 0; font-size: 13px; line-height: 1.6;">
                For urgent safety matters, call/text <a href="tel:+1${EMAIL_CONFIG.phoneNumber.replace(/-/g, '')}" style="color: #FF6B00; text-decoration: none; font-weight: 600;">${EMAIL_CONFIG.phoneNumberFormatted}</a> or email
                <a href="mailto:${EMAIL_CONFIG.email}" style="color: #FF6B00; text-decoration: none; font-weight: 600;">${EMAIL_CONFIG.email}</a>
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                <tr>
                  <td align="center">
                    <p style="color: #6c757d; margin: 0; font-size: 12px;">
                      Custom Workforce Solutions LLC | DFW Safety Services
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
  `.trim();
}

// ============================================================================
// PLAIN TEXT VERSION (Email client fallback)
// ============================================================================

/**
 * Generates plain text version of the email
 * @param {string} recipientName - Name of the recipient
 * @return {string} Plain text email content
 */
function generatePlainTextVersion(recipientName) {
  const greeting = recipientName ? recipientName : "there";

  return `
WELCOME TO SAFETY EXCELLENCE
Custom Workforce Solutions LLC

Hi ${greeting},

Thank you for reaching out! My name is Fabien Perdomo, and I am your DFW Safety Coordinator.

I am committed to maintaining a safe environment for all our associates and your facilities. Safety is not just a priority—it's a core value that protects everyone.

COMPREHENSIVE SAFETY SERVICES:
✓ Safety Talks & Training Sessions
✓ Safety Raffles & Engagement Activities
✓ Safety Quizzes & Assessments
✓ Personal Protective Equipment (PPE) Support
✓ Safety Reinforcement Programs
✓ Emergency Protocol Training & Response Planning

AVAILABLE WHEN YOU NEED ME:
Whether you need immediate assistance, have questions, or would like to schedule any of these services, please don't hesitate to reach out. I'm here to support you and ensure we maintain the highest safety standards.

CONTACT ME:
☎ Call or Text: ${EMAIL_CONFIG.phoneNumberFormatted}
✉️ Email: ${EMAIL_CONFIG.email}

Looking forward to working with you!

Fabien Perdomo
DFW Safety Coordinator
Custom Workforce Solutions LLC

---
YOUR SAFETY IS MY PRIORITY
This is an automated welcome message.
For urgent safety matters, call/text ${EMAIL_CONFIG.phoneNumberFormatted} or email ${EMAIL_CONFIG.email}

Custom Workforce Solutions LLC | DFW Safety Services
  `.trim();
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validates email address format
 * @param {string} email - Email address to validate
 * @return {boolean} True if valid email format
 */
function isValidEmail(email) {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
}

/**
 * Checks column configuration and data
 * Run this to diagnose issues with column indices
 */
function checkColumnData() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const lastRow = sheet.getLastRow();

    if (lastRow < 2) {
      Logger.log('No data rows found (only header)');
      SpreadsheetApp.getUi().alert('No Data', 'No form submissions found in the spreadsheet.', SpreadsheetApp.getUi().ButtonSet.OK);
      return;
    }

    // Get headers
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    let headerInfo = 'HEADERS:\n';
    headers.forEach((header, index) => {
      headerInfo += `Column ${String.fromCharCode(65 + index)} (Index ${index + 1}): "${header}"\n`;
    });
    Logger.log(headerInfo);

    // Get sample data from row 2
    const sampleRow = sheet.getRange(2, 1, 1, sheet.getLastColumn()).getValues()[0];
    let sampleInfo = '\nSAMPLE DATA (Row 2):\n';
    sampleRow.forEach((value, index) => {
      sampleInfo += `Column ${String.fromCharCode(65 + index)} (Index ${index + 1}): "${value}"\n`;
    });
    Logger.log(sampleInfo);

    // Check configured columns
    const emailValue = sheet.getRange(2, EMAIL_CONFIG.emailColumnIndex).getValue();
    const nameValue = sheet.getRange(2, EMAIL_CONFIG.nameColumnIndex).getValue();

    let configInfo = '\nCONFIGURED COLUMNS:\n';
    configInfo += `Email Column Index: ${EMAIL_CONFIG.emailColumnIndex} (Column ${String.fromCharCode(64 + EMAIL_CONFIG.emailColumnIndex)})\n`;
    configInfo += `  Value: "${emailValue}"\n`;
    configInfo += `  Valid: ${isValidEmail(emailValue)}\n\n`;
    configInfo += `Name Column Index: ${EMAIL_CONFIG.nameColumnIndex} (Column ${String.fromCharCode(64 + EMAIL_CONFIG.nameColumnIndex)})\n`;
    configInfo += `  Value: "${nameValue}"\n`;
    Logger.log(configInfo);

    // Show dialog
    const message = headerInfo + sampleInfo + configInfo;
    SpreadsheetApp.getUi().alert('Column Configuration Check', message, SpreadsheetApp.getUi().ButtonSet.OK);

  } catch (error) {
    Logger.log('ERROR in checkColumnData: ' + error.toString());
    SpreadsheetApp.getUi().alert('Error', 'An error occurred: ' + error.toString(), SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Sends a test email to the script owner
 * Run this to test the email template
 */
function sendTestEmail() {
  try {
    const userEmail = Session.getActiveUser().getEmail();

    if (!userEmail) {
      throw new Error('Could not get your email address. Please make sure you are logged in.');
    }

    Logger.log('Sending test email to: ' + userEmail);

    const htmlBody = generateEnhancedEmailHTML("Test User");
    const plainTextBody = generatePlainTextVersion("Test User");

    GmailApp.sendEmail(
      userEmail,
      '[TEST] ' + EMAIL_CONFIG.subject,
      plainTextBody,
      {
        name: EMAIL_CONFIG.fromName,
        replyTo: EMAIL_CONFIG.fromEmail || userEmail,
        htmlBody: htmlBody
      }
    );

    Logger.log('✅ Test email sent successfully!');
    SpreadsheetApp.getUi().alert(
      'Test Email Sent! ✅',
      `A test email has been sent to:\n${userEmail}\n\nCheck your inbox (and spam folder) to see the enhanced design with:\n• Safety badge header\n• Two-column contact card (Phone | Email)\n• Professional signature with FP monogram\n• Comprehensive services list`,
      SpreadsheetApp.getUi().ButtonSet.OK
    );

  } catch (error) {
    Logger.log('❌ ERROR sending test email: ' + error.toString());
    SpreadsheetApp.getUi().alert('Error', 'Failed to send test email:\n' + error.toString(), SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

// ============================================================================
// TRIGGER MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * Sets up the form submit trigger automatically
 * Run this ONCE after pasting the script
 */
function setupTrigger() {
  try {
    // Remove any existing triggers for onFormSubmit
    const triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(trigger => {
      if (trigger.getHandlerFunction() === 'onFormSubmit') {
        ScriptApp.deleteTrigger(trigger);
        Logger.log('Removed existing trigger');
      }
    });

    // Create new trigger
    const spreadsheet = SpreadsheetApp.getActive();
    ScriptApp.newTrigger('onFormSubmit')
      .forSpreadsheet(spreadsheet)
      .onFormSubmit()
      .create();

    Logger.log('✅ Trigger created successfully!');
    SpreadsheetApp.getUi().alert(
      'Success! ✅',
      'The trigger has been set up successfully!\n\n' +
      'Now the script will automatically send welcome emails when someone submits your form.\n\n' +
      'Next steps:\n' +
      '1. Run "sendTestEmail" to test the email template\n' +
      '2. Submit a test form to verify everything works\n' +
      '3. Check the "Email Sent" column in your spreadsheet',
      SpreadsheetApp.getUi().ButtonSet.OK
    );

  } catch (error) {
    Logger.log('❌ ERROR setting up trigger: ' + error.toString());
    SpreadsheetApp.getUi().alert(
      'Error',
      'Failed to set up trigger:\n' + error.toString() + '\n\n' +
      'You may need to authorize the script first. Try running "sendTestEmail" first to authorize, then run this again.',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}

/**
 * Removes the form submit trigger
 * Run this if you want to disable the automatic emails
 */
function removeTrigger() {
  try {
    const triggers = ScriptApp.getProjectTriggers();
    let removed = 0;

    triggers.forEach(trigger => {
      if (trigger.getHandlerFunction() === 'onFormSubmit') {
        ScriptApp.deleteTrigger(trigger);
        removed++;
      }
    });

    if (removed > 0) {
      Logger.log(`✅ Removed ${removed} trigger(s)`);
      SpreadsheetApp.getUi().alert('Success', `Removed ${removed} trigger(s). Automatic emails are now disabled.`, SpreadsheetApp.getUi().ButtonSet.OK);
    } else {
      Logger.log('No triggers found');
      SpreadsheetApp.getUi().alert('Info', 'No triggers found to remove.', SpreadsheetApp.getUi().ButtonSet.OK);
    }

  } catch (error) {
    Logger.log('❌ ERROR removing trigger: ' + error.toString());
    SpreadsheetApp.getUi().alert('Error', 'Failed to remove trigger:\n' + error.toString(), SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Checks if the trigger is set up correctly
 * Run this to verify the trigger status
 */
function checkTriggerStatus() {
  try {
    const triggers = ScriptApp.getProjectTriggers();
    const formSubmitTriggers = triggers.filter(trigger => trigger.getHandlerFunction() === 'onFormSubmit');

    let message = '';
    if (formSubmitTriggers.length === 0) {
      message = '❌ NO TRIGGER FOUND\n\nThe automatic email trigger is not set up.\n\nRun "setupTrigger" to enable automatic emails.';
      Logger.log('No trigger found');
    } else if (formSubmitTriggers.length === 1) {
      message = '✅ TRIGGER ACTIVE\n\nThe automatic email trigger is working correctly!\n\nEmails will be sent automatically when someone submits your form.';
      Logger.log('Trigger status: Active');
    } else {
      message = `⚠️ MULTIPLE TRIGGERS FOUND\n\nFound ${formSubmitTriggers.length} triggers for onFormSubmit.\n\nThis might cause duplicate emails. Run "removeTrigger" and then "setupTrigger" to fix this.`;
      Logger.log(`Warning: ${formSubmitTriggers.length} triggers found`);
    }

    SpreadsheetApp.getUi().alert('Trigger Status', message, SpreadsheetApp.getUi().ButtonSet.OK);

  } catch (error) {
    Logger.log('❌ ERROR checking trigger status: ' + error.toString());
    SpreadsheetApp.getUi().alert('Error', 'Failed to check trigger status:\n' + error.toString(), SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

// ============================================================================
// END OF SCRIPT
// ============================================================================

/**
 * QUICK START GUIDE:
 *
 * 1. Save this script (Ctrl/Cmd + S)
 * 2. Run "setupTrigger" function (select from dropdown, click Run ▶️)
 * 3. Authorize when prompted (click "Review permissions" → "Allow")
 * 4. Run "sendTestEmail" to test the email template
 * 5. Submit a test form to verify everything works
 *
 * TROUBLESHOOTING:
 * - Run "checkColumnData" to verify column configuration
 * - Run "checkTriggerStatus" to verify trigger is active
 * - Check View > Executions for error logs
 * - Make sure Column C = Email and Column B = Name
 *
 * SUPPORT:
 * If you need help, check the execution logs:
 * View > Executions (in Apps Script editor)
 */
