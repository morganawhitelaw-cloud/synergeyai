from playwright.sync_api import sync_playwright
import time

def verify_ux():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Abort CDN requests for Firebase
        page.route("**/*firebase*.js", lambda route: route.abort())

        # Inject Mock Firebase
        page.add_init_script("""
            window.firebase = {
                initializeApp: () => {},
                firestore: function() {
                    return {
                        collection: (name) => ({
                            get: async () => ({
                                forEach: (cb) => {
                                    // Mock one project
                                    cb({ id: 'test-project', data: () => ({ config: { name: 'Test Project' } }) });
                                },
                                size: 1
                            }),
                            doc: (id) => ({
                                get: async () => ({
                                    exists: true,
                                    data: () => ({
                                        userStories: [],
                                        sprintData: [{Sprint: 1, Theme: 'Theme'}]
                                    })
                                }),
                                update: async () => {
                                    console.log("Mock update called");
                                    await new Promise(r => setTimeout(r, 2000));
                                },
                                onSnapshot: () => {}
                            })
                        })
                    };
                }
            };
            window.firebase.firestore.FieldValue = {
                serverTimestamp: () => "TIMESTAMP"
            };
        """)

        # Navigate
        page.goto("http://localhost:8000/index.html")
        page.wait_for_load_state("domcontentloaded")

        # Set localStorage to ensure a project is selected
        page.evaluate("localStorage.setItem('selectedProject', 'test-project')")

        # Refresh to load data with selected project
        page.reload()
        page.wait_for_load_state("domcontentloaded")

        # Open Add Story Modal
        page.click("#addStoryBtn")
        page.wait_for_selector("#addStoryModal.visible", timeout=5000)

        save_btn = page.locator("#saveNewStoryBtn")

        # Mock alert to prevent blocking
        page.on("dialog", lambda dialog: dialog.accept())

        # Fill form to pass validation
        page.fill("#newStoryText", "Test Story")
        page.fill("#newStoryEpic", "Test Epic")

        # Click Save
        save_btn.click()

        # Wait a bit for loading state (less than the 2s mock delay)
        time.sleep(0.5)

        # Take screenshot of loading state
        page.screenshot(path="verification/verification_loading.png")

        browser.close()

if __name__ == "__main__":
    verify_ux()
