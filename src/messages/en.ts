const messages = {
  common: {
    appName: "SaaS Boilerplate",
  },
  nav: {
    plans: "Plans",
    dashboard: "Dashboard",
    signIn: "Sign in",
    signOut: "Sign out",
    getStarted: "Get started",
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
      invalidCredentials: "The email or password you entered is incorrect.",
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
    },
  },
  plans: {
    page: {
      title: "Plans",
      subtitle:
        "Choose the subscription that fits your stage. You can start on the Free tier and upgrade when you are ready.",
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
    signedInAs: "Signed in as {email}",
    currentPlanTitle: "Current plan",
    currentPlanBody: "You are currently on the {plan} plan.",
    viewPlans: "View plans",
    gettingStartedTitle: "Getting started",
    gettingStartedItems: {
      exploreApi: "Explore the API and Supabase tables.",
      configureStripe: "Configure Stripe price IDs in your env.",
      deploy: "Deploy when you are ready for production.",
    },
  },
} as const;

export default messages;
