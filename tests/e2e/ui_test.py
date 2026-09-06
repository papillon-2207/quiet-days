"""Production-component DOM tests in an isolated about:blank harness.
Not E2E: no real origin, module loading, IndexedDB, crypto, CSP, or worker.
The harness never changes managed browser policies; all data are synthetic.
"""
from pathlib import Path
import json,os,re,shutil,subprocess,time,traceback
from playwright.sync_api import sync_playwright,expect
ROOT=Path(__file__).resolve().parents[2]
EVIDENCE=ROOT/'evidence';EVIDENCE.mkdir(exist_ok=True)
html=(ROOT/'index.html').read_text()
html=re.sub(r'<meta http-equiv="Content-Security-Policy"[^>]*>','',html)
html=re.sub(r'<link[^>]*>','',html)
html=re.sub(r'<script[\s\S]*?</script>','',html)
bundle=subprocess.check_output(['node','scripts/ui-test-bundle.mjs'],cwd=ROOT,text=True)
checks=[];errors=[];start=time.time()
def record(name,fn):
 try:fn();checks.append({'name':name,'status':'passed'})
 except Exception as e:checks.append({'name':name,'status':'failed','error':str(e)});raise

def assert_(condition,message='assertion failed'):
 if not condition:raise AssertionError(message)

def duplicate_ids(page):
 return page.evaluate("() => {const a=[...document.querySelectorAll('[id]')].map(e=>e.id);return a.filter((s,i)=>a.indexOf(s)!==i)}")

with sync_playwright() as p:
 executable=os.environ.get('CHROMIUM_EXECUTABLE') or shutil.which('chromium')
 browser=p.chromium.launch(**({'executable_path':executable} if executable else {}),headless=True,args=['--no-sandbox'])
 context=browser.new_context(viewport={'width':1440,'height':1000},timezone_id='Asia/Taipei')
 page=context.new_page();page.set_default_timeout(5000);page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(html);page.add_style_tag(content=(ROOT/'src/styles.css').read_text());page.add_script_tag(content=bundle)
 try:
  record('auth supports labelled passphrase and confirmation',lambda:(expect(page.get_by_label('設定密語',exact=True)).to_be_visible(),expect(page.get_by_label('再輸入一次密語',exact=True)).to_be_visible()))
  record('passphrase permits paste and password manager autocomplete',lambda:assert_(page.get_by_label('設定密語',exact=True).get_attribute('autocomplete')=='new-password'))
  page.screenshot(path=str(EVIDENCE/'01-welcome.png'),full_page=True)
  opener=page.get_by_role('button',name='不解鎖也能查看照顧與協助');opener.click()
  record('safety help available before unlocking',lambda:expect(page.get_by_role('dialog')).to_be_visible())
  record('safety dialog has no duplicate IDs',lambda:assert_(not duplicate_ids(page),str(duplicate_ids(page))))
  page.keyboard.press('Escape')
  record('native dialog restores focus on Escape',lambda:expect(opener).to_be_focused())
  page.get_by_role('button',name='體驗空白日誌',exact=True).click()
  record('blank demo is explicit and initial focus reaches capture',lambda:expect(page.locator('#quick-marked')).to_be_focused())
  page.locator('#quick-marked').click()
  record('single-action capture completes without required symptom fields',lambda:expect(page.get_by_role('button',name='補一項內容',exact=True)).to_be_visible())
  record('capture focus remains on the activated control',lambda:expect(page.locator('#quick-marked')).to_be_focused())
  page.get_by_role('button',name='復原上一步',exact=True).click()
  record('first marker can be undone',lambda:expect(page.get_by_role('button',name='補一項內容',exact=True)).to_have_count(0))
  page.locator('#quick-unsure').click()
  record('uncertain capture invents neither bleeding nor symptom',lambda:assert_(page.evaluate("() => {const r=Object.values(__UI_TEST_APP__.vault.data.records)[0];return r.status==='unsure' && r.bleeding==='unknown' && Object.keys(r.symptoms).length===0}")))
  page.get_by_role('button',name='補一項內容',exact=True).click();page.get_by_role('button',name='疲倦或精神不足',exact=True).click()
  page.get_by_label('疲倦或精神不足對活動的影響',exact=True).select_option('rest');page.get_by_label('疲倦或精神不足大約何時發生',exact=True).select_option('afternoon')
  record('optional symptom impact and timing autosave',lambda:expect(page.locator('.save-status')).to_contain_text('已留在本次體驗中'))
  page.get_by_text('備註與選配語音',exact=True).click();secret='<img src=x onerror=alert(1)>PRIVATE_TEST_ONLY';page.get_by_label('想留下的其他內容',exact=True).fill(secret)
  # Fault injection is limited to the write boundary; the real editor drain must
  # retain newer input when an older save fails. This is NOT an IndexedDB test.
  page.evaluate("() => {const a=__UI_TEST_APP__;a.__realCommit=a.commit.bind(a);a.__failWrites=true;a.commit=async(...args)=>{if(a.__failWrites){await new Promise(r=>setTimeout(r,150));return false;}return a.__realCommit(...args);};}")
  page.get_by_label('想留下的其他內容',exact=True).fill('older unsaved draft')
  page.wait_for_timeout(480)
  page.get_by_label('想留下的其他內容',exact=True).fill(secret)
  page.wait_for_timeout(200)
  expect(page.locator('.save-status')).to_contain_text('尚未儲存')
  page.get_by_role('button',name='先查看照顧與協助',exact=True).click()
  record('safety remains accessible while a save has failed',lambda:expect(page.get_by_role('dialog')).to_be_visible())
  page.keyboard.press('Escape')
  page.wait_for_timeout(200)
  page.evaluate('() => {__UI_TEST_APP__.__failWrites=false}')
  page.get_by_role('button',name='重試儲存',exact=True).click()
  expect(page.locator('.save-status')).to_contain_text('已留在本次體驗中')
  record('failed older autosave never overwrites newer pending text on retry',lambda:assert_(page.evaluate('(s)=>Object.values(__UI_TEST_APP__.vault.data.records)[0].note===s',secret)))
  page.evaluate('() => {const a=__UI_TEST_APP__;a.commit=a.__realCommit;delete a.__realCommit;delete a.__failWrites;}')
  page.get_by_role('button',name='今天先到這裡',exact=True).click()
  record('navigation flushes pending text before leaving editor',lambda:assert_(page.evaluate('(s)=>Object.values(__UI_TEST_APP__.vault.data.records)[0].note===s',secret)))
  page.locator('#quick-none').click()
  record('contradictory global absence is rejected',lambda:expect(page.locator('#alert')).to_contain_text('不能同時'))
  page.get_by_role('button',name='補昨天的紀錄',exact=True).click();page.get_by_role('button',name='頭痛',exact=True).click()
  record('backfill is explicitly labelled as recall',lambda:expect(page.get_by_text('這一天的內容將保留實際填寫時間，並標示為回憶；不會冒充當日紀錄。',exact=True)).to_be_visible())
  record('past dates cannot select just now',lambda:assert_(page.get_by_label('頭痛大約何時發生',exact=True).locator('option[value=now]').count()==0))
  page.get_by_label('頭痛對活動的影響',exact=True).select_option('rest')
  record('backfilled symptom records next-day source',lambda:assert_(page.evaluate("() => Object.values(__UI_TEST_APP__.vault.data.records).some(r=>r.symptoms.headache&&r.provenance['symptom:headache'].origin==='next-day')")))
  page.get_by_role('button',name='今天先到這裡',exact=True).click();page.get_by_role('button',name='補一項內容',exact=True).click();page.get_by_text('記錄或修正出血狀況',exact=True).click()
  page.get_by_label('我已確認這一天是本次經期開始',exact=True).click()
  record('start date cannot be set without confirmed bleeding',lambda:expect(page.get_by_label('我已確認這一天是本次經期開始',exact=True)).not_to_be_checked())
  page.get_by_label('這一天的出血狀況',exact=True).select_option('confirmed');page.get_by_label('我已確認這一天是本次經期開始',exact=True).check();page.get_by_role('button',name='今天先到這裡',exact=True).click()
  record('confirmed onset enables optional neutral previous-days review',lambda:expect(page.get_by_role('button',name='回顧昨天',exact=True)).to_be_visible())
  page.get_by_role('button',name='回顧昨天',exact=True).click();page.get_by_label('头痛對活動的影響'.replace('头','頭'),exact=True).select_option('slow');page.get_by_role('button',name='今天先到這裡',exact=True).click()
  record('post-onset recall source remains distinct',lambda:assert_(page.evaluate("() => Object.values(__UI_TEST_APP__.vault.data.records).some(r=>r.provenance['symptom:headache']?.afterStartRecall)")))
  page.get_by_role('link',name='我的資料',exact=True).click();page.get_by_role('button',name='先預覽文字摘要',exact=True).click()
  record('default sharing excludes private free notes',lambda:assert_('PRIVATE_TEST_ONLY' not in page.get_by_role('dialog').inner_text()))
  page.keyboard.press('Escape');page.get_by_label('自由備註',exact=True).check();page.get_by_role('button',name='先預覽文字摘要',exact=True).click()
  record('opted-in note renders literal text, not HTML',lambda:(expect(page.get_by_role('dialog')).to_contain_text(secret),assert_(page.get_by_role('dialog').locator('img').count()==0)))
  page.keyboard.press('Escape');page.get_by_role('link',name='設定',exact=True).click();page.get_by_label('更大的文字',exact=True).check();page.get_by_label('高對比',exact=True).check()
  record('large text and high-contrast preferences apply',lambda:assert_(page.locator('html').get_attribute('class')=='large-text high-contrast'))
  page.get_by_label('偏好的經期稱呼（最多 16 字）',exact=True).fill('生理期');page.get_by_label('偏好的經期稱呼（最多 16 字）',exact=True).press('Tab');page.get_by_role('link',name='今天',exact=True).click()
  record('preferred term appears in diary content',lambda:assert_('生理期' in page.locator('main').text_content()))
  page.set_viewport_size({'width':320,'height':850})
  record('320px viewport with enlarged text does not horizontally overflow',lambda:assert_(page.evaluate('document.documentElement.scrollWidth <= window.innerWidth'),str(page.evaluate('({scroll:document.documentElement.scrollWidth,width:innerWidth})'))))
  record('quick targets are at least 48x48 CSS px',lambda:assert_(all(page.locator('#quick-'+k).bounding_box()[dim]>=48 for k in ['marked','none','unsure','skipped'] for dim in ['width','height'])))
  page.screenshot(path=str(EVIDENCE/'03-mobile-large-text.png'),full_page=True)
  page.get_by_role('link',name='個人模式',exact=True).click()
  record('insights contain text-based uncertainty instead of inaccessible chart-only output',lambda:expect(page.get_by_role('heading',name='下次生理期的粗略範圍')).to_be_visible())
  record('current page has unique element IDs',lambda:assert_(not duplicate_ids(page),str(duplicate_ids(page))))
  record('interactive controls have names or associated labels',lambda:assert_(page.evaluate("() => [...document.querySelectorAll('button,input,select,textarea')].every(e=>!e.getClientRects().length||e.textContent.trim()||e.getAttribute('aria-label')||e.labels?.length)")))
  record('no JavaScript errors during tested interactions',lambda:assert_(not errors,str(errors)))
  # Showcase screenshot uses only synthetic data; reset demo with the fixture via the actual auth control.
  page.evaluate('() => {const a=__UI_TEST_APP__;a.cleanupEditor?.();a.flushEditor=null;a.vault.lock();a.render(false)}')
  page.set_viewport_size({'width':1440,'height':1000});page.get_by_role('button',name='查看虛構示範資料',exact=True).click();page.screenshot(path=str(EVIDENCE/'02-demo.png'),full_page=True)
  page.get_by_role('link',name='個人模式',exact=True).click();page.screenshot(path=str(EVIDENCE/'04-insights.png'),full_page=True)
 except Exception as e:
  if not checks or checks[-1]['status']!='failed':checks.append({'name':'scenario execution','status':'failed','error':str(e)})
  page.screenshot(path=str(EVIDENCE/'ui-failure.png'),full_page=True);traceback.print_exc()
 finally:
  report={'mode':'isolated-component-DOM; not served-origin E2E','browser':browser.version,'seconds':round(time.time()-start,2),'checks':checks,'page_errors':errors,'not_tested':['native ESM loading','CSP enforcement','IndexedDB transactions','encryption in browser','PWA/offline worker','VoiceOver','TalkBack','actual users','real Chinese local speech']}
  (EVIDENCE/'ui-tests.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
  browser.close()
failed=[x for x in checks if x['status']!='passed'];print(json.dumps({'passed':len(checks)-len(failed),'failed':len(failed),'mode':report['mode']},ensure_ascii=False));raise SystemExit(1 if failed else 0)
