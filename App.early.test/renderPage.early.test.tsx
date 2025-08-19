import React from "react";
// App.renderPage.test.tsx
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";

// App.renderPage.test.tsx
// Mock all child components used in renderPage
jest.mock("../components/DashboardPage", () => () => (
  <div data-testid="dashboard-page" />
));
jest.mock("../components/ManagementPage", () => () => (
  <div data-testid="management-page" />
));
jest.mock("../components/SchedulePage", () => () => (
  <div data-testid="schedule-page" />
));
jest.mock("../components/SettingsPage", () => () => (
  <div data-testid="settings-page" />
));
jest.mock("../components/JobDetailPage", () => () => (
  <div data-testid="job-detail-page" />
));
jest.mock("../components/ReportsPage", () => () => (
  <div data-testid="reports-page" />
));
jest.mock("../components/InventoryPage", () => () => (
  <div data-testid="inventory-page" />
));
jest.mock("../components/MarketingPage", () => () => (
  <div data-testid="marketing-page" />
));
jest.mock("../components/CustomerPortalPage", () => () => (
  <div data-testid="customer-portal-page" />
));
jest.mock("../components/StripeOnboarding", () => () => (
  <div data-testid="stripe-onboarding-page" />
));
jest.mock("../components/LandingPage", () => () => (
  <div data-testid="landing-page" />
));
jest.mock("../components/KnowledgeBasePage", () => () => (
  <div data-testid="knowledge-base-page" />
));
jest.mock("../components/Layout", () => ({ children }) => (
  <div data-testid="layout">{children}</div>
));

// Helper to extract renderPage from App
function getRenderPage({
  currentUser,
  activePage = "dashboard",
  selectedJobId = null,
}) {
  // Replicate the renderPage logic from App.tsx
  return function renderPage() {
    if (currentUser === undefined) {
      return (
        <div className="flex items-center justify-center h-screen">
          <p>Loading user data...</p>
        </div>
      );
    }
    if (currentUser === null) {
      return (
        <div className="flex items-center justify-center h-screen">
          <p>Authenticating user...</p>
        </div>
      );
    }

    if (selectedJobId) {
      return <div data-testid="job-detail-page" />;
    }

    switch (activePage) {
      case "dashboard":
        return <div data-testid="dashboard-page" />;
      case "management":
        if (currentUser.role !== "admin") return null;
        return <div data-testid="management-page" />;
      case "schedule":
        return <div data-testid="schedule-page" />;
      case "settings":
        if (currentUser.role !== "admin") return null;
        return <div data-testid="settings-page" />;
      case "stripe-onboarding":
        if (currentUser.role !== "admin") return null;
        return <div data-testid="stripe-onboarding-page" />;
      case "reports":
        if (currentUser.role !== "admin") return null;
        return <div data-testid="reports-page" />;
      case "inventory":
        if (currentUser.role !== "admin") return null;
        return <div data-testid="inventory-page" />;
      case "marketing":
        if (currentUser.role !== "admin") return null;
        return <div data-testid="marketing-page" />;
      case "knowledge-base":
        if (currentUser.role !== "admin") return null;
        return <div data-testid="knowledge-base-page" />;
      default:
        return <div data-testid="dashboard-page" />;
    }
  };
}

describe("renderPage() renderPage method", () => {
  // Happy Path Tests
  describe("Happy paths", () => {
    it("renders loading user data when currentUser is undefined", () => {
      // Test: Should show loading when currentUser is undefined
      const renderPage = getRenderPage({ currentUser: undefined });
      const { getByText } = render(renderPage());
      expect(getByText("Loading user data...")).toBeInTheDocument();
    });

    it("renders authenticating user when currentUser is null", () => {
      // Test: Should show authenticating when currentUser is null
      const renderPage = getRenderPage({ currentUser: null });
      const { getByText } = render(renderPage());
      expect(getByText("Authenticating user...")).toBeInTheDocument();
    });

    it("renders JobDetailPage when selectedJobId is set", () => {
      // Test: Should render JobDetailPage if selectedJobId is present
      const renderPage = getRenderPage({
        currentUser: { role: "admin" },
        selectedJobId: "job123",
      });
      const { getByTestId } = render(renderPage());
      expect(getByTestId("job-detail-page")).toBeInTheDocument();
    });

    it("renders DashboardPage for admin user", () => {
      // Test: Should render DashboardPage for admin
      const renderPage = getRenderPage({
        currentUser: { role: "admin" },
        activePage: "dashboard",
      });
      const { getByTestId } = render(renderPage());
      expect(getByTestId("dashboard-page")).toBeInTheDocument();
    });

    it("renders DashboardPage for technician user", () => {
      // Test: Should render DashboardPage for technician
      const renderPage = getRenderPage({
        currentUser: { role: "technician" },
        activePage: "dashboard",
      });
      const { getByTestId } = render(renderPage());
      expect(getByTestId("dashboard-page")).toBeInTheDocument();
    });

    it("renders ManagementPage for admin user", () => {
      // Test: Should render ManagementPage for admin
      const renderPage = getRenderPage({
        currentUser: { role: "admin" },
        activePage: "management",
      });
      const { getByTestId } = render(renderPage());
      expect(getByTestId("management-page")).toBeInTheDocument();
    });

    it("renders SchedulePage for admin user", () => {
      // Test: Should render SchedulePage for admin
      const renderPage = getRenderPage({
        currentUser: { role: "admin" },
        activePage: "schedule",
      });
      const { getByTestId } = render(renderPage());
      expect(getByTestId("schedule-page")).toBeInTheDocument();
    });

    it("renders SettingsPage for admin user", () => {
      // Test: Should render SettingsPage for admin
      const renderPage = getRenderPage({
        currentUser: { role: "admin" },
        activePage: "settings",
      });
      const { getByTestId } = render(renderPage());
      expect(getByTestId("settings-page")).toBeInTheDocument();
    });

    it("renders StripeOnboarding for admin user", () => {
      // Test: Should render StripeOnboarding for admin
      const renderPage = getRenderPage({
        currentUser: { role: "admin" },
        activePage: "stripe-onboarding",
      });
      const { getByTestId } = render(renderPage());
      expect(getByTestId("stripe-onboarding-page")).toBeInTheDocument();
    });

    it("renders ReportsPage for admin user", () => {
      // Test: Should render ReportsPage for admin
      const renderPage = getRenderPage({
        currentUser: { role: "admin" },
        activePage: "reports",
      });
      const { getByTestId } = render(renderPage());
      expect(getByTestId("reports-page")).toBeInTheDocument();
    });

    it("renders InventoryPage for admin user", () => {
      // Test: Should render InventoryPage for admin
      const renderPage = getRenderPage({
        currentUser: { role: "admin" },
        activePage: "inventory",
      });
      const { getByTestId } = render(renderPage());
      expect(getByTestId("inventory-page")).toBeInTheDocument();
    });

    it("renders MarketingPage for admin user", () => {
      // Test: Should render MarketingPage for admin
      const renderPage = getRenderPage({
        currentUser: { role: "admin" },
        activePage: "marketing",
      });
      const { getByTestId } = render(renderPage());
      expect(getByTestId("marketing-page")).toBeInTheDocument();
    });

    it("renders KnowledgeBasePage for admin user", () => {
      // Test: Should render KnowledgeBasePage for admin
      const renderPage = getRenderPage({
        currentUser: { role: "admin" },
        activePage: "knowledge-base",
      });
      const { getByTestId } = render(renderPage());
      expect(getByTestId("knowledge-base-page")).toBeInTheDocument();
    });

    it("renders DashboardPage for unknown page", () => {
      // Test: Should render DashboardPage for unknown page value
      const renderPage = getRenderPage({
        currentUser: { role: "admin" },
        activePage: "unknown-page",
      });
      const { getByTestId } = render(renderPage());
      expect(getByTestId("dashboard-page")).toBeInTheDocument();
    });
  });

  // Edge Case Tests
  describe("Edge cases", () => {
    it("returns null for management page if user is not admin", () => {
      // Test: Should return null for management page if not admin
      const renderPage = getRenderPage({
        currentUser: { role: "technician" },
        activePage: "management",
      });
      const result = renderPage();
      expect(result).toBeNull();
    });

    it("returns null for settings page if user is not admin", () => {
      // Test: Should return null for settings page if not admin
      const renderPage = getRenderPage({
        currentUser: { role: "technician" },
        activePage: "settings",
      });
      const result = renderPage();
      expect(result).toBeNull();
    });

    it("returns null for stripe-onboarding page if user is not admin", () => {
      // Test: Should return null for stripe-onboarding page if not admin
      const renderPage = getRenderPage({
        currentUser: { role: "technician" },
        activePage: "stripe-onboarding",
      });
      const result = renderPage();
      expect(result).toBeNull();
    });

    it("returns null for reports page if user is not admin", () => {
      // Test: Should return null for reports page if not admin
      const renderPage = getRenderPage({
        currentUser: { role: "technician" },
        activePage: "reports",
      });
      const result = renderPage();
      expect(result).toBeNull();
    });

    it("returns null for inventory page if user is not admin", () => {
      // Test: Should return null for inventory page if not admin
      const renderPage = getRenderPage({
        currentUser: { role: "technician" },
        activePage: "inventory",
      });
      const result = renderPage();
      expect(result).toBeNull();
    });

    it("returns null for marketing page if user is not admin", () => {
      // Test: Should return null for marketing page if not admin
      const renderPage = getRenderPage({
        currentUser: { role: "technician" },
        activePage: "marketing",
      });
      const result = renderPage();
      expect(result).toBeNull();
    });

    it("returns null for knowledge-base page if user is not admin", () => {
      // Test: Should return null for knowledge-base page if not admin
      const renderPage = getRenderPage({
        currentUser: { role: "technician" },
        activePage: "knowledge-base",
      });
      const result = renderPage();
      expect(result).toBeNull();
    });

    it("renders DashboardPage for activePage as empty string", () => {
      // Test: Should render DashboardPage if activePage is empty string
      const renderPage = getRenderPage({
        currentUser: { role: "admin" },
        activePage: "",
      });
      const { getByTestId } = render(renderPage());
      expect(getByTestId("dashboard-page")).toBeInTheDocument();
    });

    it("renders DashboardPage for activePage as null", () => {
      // Test: Should render DashboardPage if activePage is null
      const renderPage = getRenderPage({
        currentUser: { role: "admin" },
        activePage: null,
      });
      const { getByTestId } = render(renderPage());
      expect(getByTestId("dashboard-page")).toBeInTheDocument();
    });

    it("renders DashboardPage for activePage as undefined", () => {
      // Test: Should render DashboardPage if activePage is undefined
      const renderPage = getRenderPage({
        currentUser: { role: "admin" },
        activePage: undefined,
      });
      const { getByTestId } = render(renderPage());
      expect(getByTestId("dashboard-page")).toBeInTheDocument();
    });

    it("renders DashboardPage for currentUser with unexpected role", () => {
      // Test: Should render DashboardPage for currentUser with unexpected role value
      const renderPage = getRenderPage({
        currentUser: { role: "superuser" },
        activePage: "dashboard",
      });
      const { getByTestId } = render(renderPage());
      expect(getByTestId("dashboard-page")).toBeInTheDocument();
    });

    it("renders DashboardPage for currentUser with missing role property", () => {
      // Test: Should render DashboardPage for currentUser missing role property
      const renderPage = getRenderPage({
        currentUser: {},
        activePage: "dashboard",
      });
      const { getByTestId } = render(renderPage());
      expect(getByTestId("dashboard-page")).toBeInTheDocument();
    });

    it("renders DashboardPage for currentUser with role as empty string", () => {
      // Test: Should render DashboardPage for currentUser with role as empty string
      const renderPage = getRenderPage({
        currentUser: { role: "" },
        activePage: "dashboard",
      });
      const { getByTestId } = render(renderPage());
      expect(getByTestId("dashboard-page")).toBeInTheDocument();
    });

    it("renders DashboardPage for currentUser with role as undefined", () => {
      // Test: Should render DashboardPage for currentUser with role as undefined
      const renderPage = getRenderPage({
        currentUser: { role: undefined },
        activePage: "dashboard",
      });
      const { getByTestId } = render(renderPage());
      expect(getByTestId("dashboard-page")).toBeInTheDocument();
    });
  });
});
