from playwright.sync_api import Page, expect, sync_playwright
import time

def verify_dashboard_performance(page: Page):
  # 1. Arrange: Go to the app homepage.
  page.goto("http://localhost:5173")

  # Wait for Dashboard to be populated and take screenshot
  time.sleep(2)
  page.screenshot(path="/home/jules/verification/dashboard.png")

if __name__ == "__main__":
  with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    try:
      verify_dashboard_performance(page)
    finally:
      browser.close()
