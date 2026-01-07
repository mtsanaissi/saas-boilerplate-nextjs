const messages = {
  common: {
    appName: "SaaS Boilerplate",
    appDescription: "Next.js, Supabase, Stripe, Tailwind v4 & DaisyUI",
    footerCopyright: "© {year} SaaS Boilerplate",
  },
  errors: {
    invalidCredentials: "The email or password you entered is incorrect.",
    invalidEmail: "Please enter a valid email address.",
    invalidPassword: "Please enter a valid password.",
    invalidProfile: "Please check your profile details and try again.",
    emailAlreadyRegistered:
      "An account with this email already exists. Please sign in instead.",
    signupFailed:
      "We could not create your account. Please try again in a moment.",
    resetFailed: "We could not send a password reset email. Please try again.",
    updatePasswordFailed:
      "We could not update your password. Please try again.",
    magicLinkFailed:
      "We could not send the magic link email. Please try again.",
    resendFailed:
      "We could not resend the verification email. Please try again.",
    invalidSession:
      "Your session has expired. Please request a new link and try again.",
    profileUpdateFailed:
      "We could not save your profile changes. Please try again.",
    emailChangeFailed: "We could not start the email change. Please try again.",
    emailChangeSame:
      "That is already your current email. Please enter a new address.",
    accessDenied: "You do not have access to this feature.",
    emailUnverified:
      "Please verify your email address before continuing. Check your inbox for the verification link.",
    upgradeRequired:
      "This feature requires an upgraded plan. Please choose a plan to continue.",
    unauthorized: "Please sign in to continue.",
    usageLimitExceeded:
      "You have reached your usage limit for this period. Please upgrade your plan or wait for the reset.",
    rateLimited: "Too many requests. Please wait and try again.",
    billingPortalUnavailable:
      "We could not open the billing portal. Please try again later.",
    consentUpdateFailed:
      "We could not update your consent preferences. Please try again.",
    invalidPlan: "The selected plan is not valid.",
    planNotAvailable:
      "This plan is currently unavailable. Please choose another plan.",
    checkoutUnavailable:
      "We could not start the checkout session. Please try again.",
    dataExportFailed:
      "We could not generate your data export. Please try again.",
    deletionRequestFailed:
      "We could not start the deletion flow. Please try again.",
    deletionConfirmationRequired:
      "Please enter the confirmation phrase to continue.",
    deletionConfirmationMismatch:
      "The confirmation phrase did not match. Please try again.",
    deletionRequestInvalid:
      "We could not find a valid deletion request. Please start again.",
    deletionRequestExpired:
      "Your deletion request expired. Please request a new one.",
    deletionConfirmFailed:
      "We could not delete your account. Please try again.",
    unknown: "Something went wrong. Please try again.",
  },
  nav: {
    plans: "Plans",
    dev: "Dev",
    skipToContent: "Skip to content",
    primaryNavLabel: "Primary",
    dashboard: "Dashboard",
    settings: "Settings",
    signIn: "Sign in",
    signOut: "Sign out",
    getStarted: "Get started",
    privacy: "Privacy",
    terms: "Terms",
  },
  home: {
    hero: {
      title: "SaaS Boilerplate",
      description:
        "Your environment is fully configured. This page demonstrates the integration of your local Dockerized database with the modern frontend stack.",
      primaryCta: "Get Started",
      secondaryCta: "View Documentation",
      footer: "Running on WSL 2 • Ubuntu 24.04",
    },
    techStack: {
      title: "Tech Stack",
      items: [
        "Next.js 16 (App Router)",
        "Tailwind CSS v4 (Alpha)",
        "DaisyUI v5",
        "Supabase (Docker)",
      ],
    },
  },
  auth: {
    login: {
      title: "Sign in",
      subtitle: "Access your dashboard and manage your subscription.",
      emailLabel: "Email",
      passwordLabel: "Password",
      submit: "Continue",
      newHere: "New here?",
      createAccount: "Create an account",
      forgotPassword: "Forgot your password?",
      magicLink: "Email me a magic link",
      invalidCredentials: "The email or password you entered is incorrect.",
      dividerOr: "Or",
    },
    register: {
      title: "Create your account",
      subtitle: "Set up your workspace in a few seconds.",
      emailLabel: "Email",
      passwordLabel: "Password",
      passwordHelp: "Minimum 8 characters. Use a strong unique password.",
      submit: "Create account",
      alreadyHaveAccount: "Already have an account?",
      signIn: "Sign in",
      invalidCredentials: "Please provide a valid email and password.",
      signupFailed:
        "We could not create your account. Please try again in a moment.",
    },
    confirm: {
      title: "Check your inbox",
      subtitle:
        "We have sent you a confirmation email. Click the link to verify your account.",
      body: "Once your email is verified, you can sign in and access your dashboard.",
      backToHome: "Back to home",
      goToSignIn: "Go to sign in",
      resendLink: "Resend verification email",
    },
    forgot: {
      title: "Reset your password",
      subtitle: "We will email you a link to reset your password.",
      emailLabel: "Email",
      submit: "Send reset link",
      success:
        "If an account exists for that email, we have sent a reset link.",
      backToSignIn: "Back to sign in",
    },
    reset: {
      title: "Choose a new password",
      subtitle: "Enter a new password for your account.",
      passwordLabel: "New password",
      passwordHelp: "Minimum 8 characters. Use a strong unique password.",
      submit: "Update password",
      success: "Your password has been updated. You can now sign in.",
      backToSignIn: "Back to sign in",
    },
    magic: {
      title: "Email me a sign-in link",
      subtitle: "We will send a magic link to sign you in securely.",
      emailLabel: "Email",
      submit: "Send magic link",
      success:
        "If an account exists for that email, we have sent a sign-in link.",
      backToSignIn: "Back to sign in",
    },
    verify: {
      title: "Resend verification email",
      subtitle:
        "We will resend your verification email so you can confirm your account.",
      emailLabel: "Email",
      submit: "Resend email",
      success:
        "If an account exists for that email, we have resent the verification email.",
      backToSignIn: "Back to sign in",
    },
  },
  plans: {
    page: {
      title: "Plans",
      subtitle:
        "Choose the subscription that fits your stage. You can start on the Free tier and upgrade when you are ready.",
      priceFree: "Free",
      perMonthSuffix: "/month",
    },
    alerts: {
      success:
        "Your payment was successful. Your subscription will be updated once the webhook is processed.",
      canceled: "Checkout canceled. You have not been charged.",
      invalidPlan: "The selected plan is not valid.",
      planNotAvailable:
        "This plan is currently unavailable. Please choose another plan.",
      checkoutUnavailable:
        "We could not start the checkout session. Please try again.",
      mustSignInPrefix: "You need to",
      mustSignInLink: "sign in",
      mustSignInSuffix: "before subscribing so we can link your account.",
    },
    cards: {
      free: {
        name: "Free",
        description: "Perfect to explore the product and local dev.",
        highlight: "No credit card required",
        features: [
          "Up to 1 project",
          "Community support",
          "Local Supabase setup",
        ],
        ctaSignedIn: "Go to dashboard",
        ctaSignedOut: "Get started for free",
      },
      starter: {
        name: "Starter",
        description: "For freelancers and small teams getting started.",
        highlight: "Best for early-stage SaaS",
        features: ["Up to 5 projects", "Email support", "Basic analytics"],
        cta: "Subscribe",
        ctaDisabled: "Sign in to subscribe",
      },
      pro: {
        name: "Pro",
        description: "Scale with advanced features and priority support.",
        highlight: "For growing teams in production",
        features: [
          "Unlimited projects",
          "Priority support",
          "Advanced analytics",
        ],
        cta: "Subscribe",
        ctaDisabled: "Sign in to subscribe",
      },
    },
  },
  dashboard: {
    title: "Dashboard",
    signedInAs: "Signed in as {name}",
    localeLabel: "Locale: {locale}",
    currentPlanTitle: "Current plan",
    currentPlanBody: "You are currently on the {plan} plan.",
    planStatusLabel: "Status: {status}",
    renewalLabel: "Renews on {date}",
    cancelAtPeriodEndLabel: "Cancels on {date}",
    viewPlans: "View plans",
    viewSettings: "Settings",
    analyticsTitle: "Analytics",
    analyticsBody: "Starter and Pro plans can access analytics.",
    viewAnalytics: "View analytics",
    analyticsPlaceholder: "Analytics data will appear here once connected.",
    upgradePlan: "Upgrade plan",
    gettingStartedTitle: "Getting started",
    gettingStartedItems: {
      exploreApi: "Explore the API and Supabase tables.",
      configureStripe: "Configure Stripe price IDs in your env.",
      deploy: "Deploy when you are ready for production.",
    },
    planNames: {
      free: "Free",
      starter: "Starter",
      pro: "Pro",
    },
    planStatuses: {
      free: "Free",
      trialing: "Trialing",
      active: "Active",
      past_due: "Past due",
      canceled: "Canceled",
      unpaid: "Unpaid",
      incomplete: "Incomplete",
      incomplete_expired: "Incomplete expired",
      paused: "Paused",
    },
  },
  settings: {
    title: "Profile settings",
    subtitle: "Update how your account appears across the app.",
    displayNameLabel: "Display name",
    displayNameHelp: "Shown in the dashboard and emails.",
    avatarUrlLabel: "Avatar URL",
    avatarUrlHelp: "Use a public image URL (https://).",
    avatarUrlPlaceholder: "https://",
    localeLabel: "Preferred locale",
    save: "Save changes",
    success: "Your profile has been updated.",
    emailTitle: "Email address",
    emailSubtitle: "Update the email used for sign-in.",
    currentEmailLabel: "Current email",
    newEmailLabel: "New email",
    newEmailPlaceholder: "you@example.com",
    emailChangeHelp:
      "We will send a verification link to the new email address.",
    emailChangeCta: "Request email change",
    emailChangeRequested: "Check your new email address to confirm the change.",
    emailChangeConfirmed: "Your email address has been updated.",
    backToDashboard: "Back to dashboard",
    billingTitle: "Billing",
    billingSubtitle: "Manage your subscription and payment details.",
    billingPlanLabel: "Plan",
    billingStatusLabel: "Status",
    billingRenewalLabel: "Renews on",
    billingCancelLabel: "Cancels on",
    manageBilling: "Manage billing",
    noBilling: "No active subscription found.",
    sessionsTitle: "Active sessions",
    sessionsSubtitle: "Review where your account is signed in.",
    currentSession: "Current session",
    otherSessions: "Other sessions",
    ipLabel: "IP: {value}",
    userAgentLabel: "User agent: {value}",
    lastSeenLabel: "Last seen: {date}",
    unknownValue: "unknown",
    sessionsEmpty: "No sessions found.",
    signOutOthers: "Sign out other sessions",
    signOutAll: "Sign out all sessions",
    consentsTitle: "Consent preferences",
    consentsSubtitle: "Control analytics and marketing preferences.",
    analyticsConsent: "Allow analytics tracking",
    marketingConsent: "Allow marketing emails",
    termsConsent: "I agree to the Terms of Service",
    privacyConsent: "I agree to the Privacy Policy",
    saveConsents: "Save preferences",
    auditLogsTitle: "Audit logs",
    auditLogsSubtitle: "Recent security events for your account.",
    auditLogsEmpty: "No audit events recorded yet.",
    dataTitle: "Data and privacy",
    dataExportTitle: "Export your data",
    dataExportSubtitle:
      "Download a JSON archive of your profile, billing, and usage data.",
    dataExportCta: "Download data export",
    deletionTitle: "Delete account",
    deletionSubtitle:
      "This permanently deletes your account and removes or anonymizes your data.",
    deletionRequestCta: "Request account deletion",
    deletionRequested: "Deletion request created. Confirm below to finish.",
    deletionExpires: "This request expires on {date}.",
    deletionExpired:
      "Your previous deletion request expired. Request a new one to continue.",
    deletionConfirmPhrase: "DELETE",
    deletionConfirmLabel: "Type {phrase} to confirm",
    deletionConfirmHelp: "This action is permanent and cannot be undone.",
    deletionConfirmCta: "Delete my account",
  },
  accountDeleted: {
    title: "Account deleted",
    subtitle: "Your account has been removed.",
    body: "Your profile, billing, and usage data have been deleted or anonymized.",
    backToHome: "Back to home",
    createAccount: "Create a new account",
  },
  usage: {
    title: "Usage",
    subtitle: "Track your credits usage for the current period.",
    creditsRemaining: "Credits remaining",
    creditsUsed: "Credits used",
    resetOn: "Resets on {date}",
    viewDetails: "View usage details",
    noCredits: "No credits are available for the current plan.",
    eventsTitle: "Recent usage",
    emptyEvents: "No usage recorded yet.",
    periodLabel: "Current period: {start}–{end}",
    featureLabel: "Feature",
    creditsLabel: "Credits",
    whenLabel: "When",
    devGenerate: "Add dev usage event",
  },
  analytics: {
    disabled: "Analytics tracking is disabled.",
  },
  system: {
    healthCheck: {
      title: "System status",
      serviceName: "Supabase",
      statusChecking: "Checking...",
      statusOnline: "🟢 Online",
      statusOffline: "🔴 Offline",
      envChecking: "Checking...",
      envLoaded: "Env vars loaded",
      missingEnvVars: "Missing env vars",
    },
  },
  dev: {
    index: {
      title: "Dev playground",
      description:
        "Placeholder pages to exercise accessibility, forms/alerts, focus styles, and error states.",
      links: {
        a11yTitle: "A11y surface",
        a11yDescription:
          "Landmarks/headings checklist, focusable controls, and contrast samples.",
        formsTitle: "Forms + alerts",
        formsDescription:
          "Inputs, validation states, and live region placeholders.",
        errorsTitle: "Error states",
        errorsDescription:
          "Query-param driven error codes to validate error-message mapping.",
      },
    },
    a11y: {
      title: "Accessibility surface",
      intro:
        "Use this page to validate focus visibility, heading hierarchy, and interactive control semantics.",
      focusableTitle: "Focusable controls",
      focusable: {
        primary: "Primary button",
        outline: "Outline button",
        ghost: "Ghost button",
        inPageLink: "In-page link",
        checkbox: "Checkbox",
        toggle: "Toggle",
      },
      tip: "Tip: keyboard-tab through the controls and confirm the focus indicator is always visible.",
      contrastTitle: "Contrast samples",
      contrast: {
        baseTitle: "Base surface",
        baseBody: "Text on base background for quick visual checks.",
        primaryTitle: "Primary surface",
        primaryBody: "Verify contrast for primary tokens.",
        successTitle: "Success surface",
        successBody: "Used for success alerts and badges.",
        errorTitle: "Error surface",
        errorBody: "Used for error alerts and validation messages.",
      },
      headingsTitle: "Headings + content",
      headingsBody:
        "This section exists to help validate consistent heading order and a single page-level heading.",
      longParagraph:
        "Placeholder paragraph {index}. Use this to test scroll, focus retention, and any skip-to-content behavior once added.",
      longHint: "Add <code>?long=1</code> to generate more content.",
    },
    forms: {
      title: "Forms + alerts surface",
      description:
        "Placeholder validation states for <code>aria-invalid</code>, <code>aria-describedby</code>, and alert semantics.",
      quickToggles: "Quick toggles:",
      toggles: {
        invalidEmail: "invalid email",
        invalidPassword: "invalid password",
        errorAlert: "error alert",
        successAlert: "success alert",
        reset: "reset",
      },
      alertError: 'Placeholder error alert (role="alert").',
      alertSuccess: 'Placeholder success message (role="status").',
      formTitle: "Example form",
      emailLabel: "Email",
      passwordLabel: "Password",
      emailPlaceholder: "name@example.com",
      passwordPlaceholder: "••••••••",
      emailError: "Placeholder email error text (described by input).",
      emailHelp: "Placeholder helper text.",
      passwordError: "Placeholder password error text (described by input).",
      passwordHelp: "Placeholder helper text.",
      submitPlaceholder: "Submit (placeholder)",
      secondaryAction: "Secondary action",
      linkAction: "Link-style action",
    },
    errors: {
      title: "Error states surface",
      description:
        "Use query params to simulate error codes and validate user-facing error messaging.",
      currentCodeTitle: "Current error code",
      currentCodeLabel: "Resolved <code>error</code> query param:",
      noneLabel: "(none)",
      noCodeProvided: "No error code provided.",
      tryCodeTitle: "Try a code",
      clear: "clear",
      knownCodes: [
        "invalid_credentials",
        "signup_failed",
        "invalid_plan",
        "plan_not_available",
        "checkout_unavailable",
        "some_unknown_error",
      ],
    },
    usage: {
      errorPrefix: "Error: {message}",
    },
  },
  legal: {
    termsTitle: "Terms of Service",
    privacyTitle: "Privacy Policy",
    updatedAt: "Last updated: {date}",
    privacyParagraphOne:
      "We collect the minimum information needed to operate the service, including account and usage data.",
    privacyParagraphTwo:
      "We do not sell your data. You can manage consent preferences in your account settings.",
    privacyParagraphThree:
      "If you have questions about data handling, contact support.",
  },
} as const;

export default messages;
