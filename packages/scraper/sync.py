import urllib
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support.expected_conditions import presence_of_element_located

#This example requires Selenium WebDriver 3.13 or newer
# with webdriver.Firefox() as driver:
#     wait = WebDriverWait(driver, 10)
#     driver.get("https://google.com/ncr")
#     driver.find_element(By.NAME, "q").send_keys("cheese" + Keys.RETURN)
#     first_result = wait.until(presence_of_element_located((By.CSS_SELECTOR, "h3")))
#     print(first_result.get_attribute("textContent"))

def get_images():
    pass

# authenticate
# paste email
# password + keep me signed in
# didn't get a verification code? >  text me
# paste code in
# trust browser button

# ---

# click notes
self.get('https://icloud.com/notes')
# search all notes

class ChromefoxTest:
    def __init__(self,url):
        self.url=url
        self.invite_url='https://www.icloud.com/notes/0cniGhmGXlGNrO__cLoPKfBHg#Drawing_Note_2'
        self.uri = []
        self.folder = '/Users/jonbo/Github/apple-notes-bridge'

    def chromeTest(self):
        self.driver=webdriver.Chrome()
        self.driver.get(self.invite_url)
        # self.r=self.driver.find_elements_by_tag_name('img')
        # for v in self.r:
        #     src = v.get_attribute("src")
        #     self.uri.append(src)
        #     pos = len(src) - src[::-1].index('/')
        #     print(src[pos:])
        #     self.g=urllib.urlretrieve(src, "/".join([self.folder, src[pos:]]))

        # find button   
        continue_button = self.driver.find_element_by_xpath("//span[@title='Open In Notes']")
        continue_button.click()
        # click it 

        # go to icloud
        self.driver.get('https://www.icloud.com')

        # walk to notes

        # filter by text to name

        # click on note
        
        # copy all contents

        # upload to ipfs



if __name__ == "__main__": 
    FT=ChromefoxTest("https://www.icloud.com/notes/0cniGhmGXlGNrO__cLoPKfBHg#Drawing_Note_2")
    FT.chromeTest()
