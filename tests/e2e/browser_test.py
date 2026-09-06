"""Real served-origin Chromium E2E. No mocks; exits 2 when environment blocks URLs.
Run `npm run build` first, then `npm run test:browser` on an unrestricted local machine.
Only synthetic health data and a test-only passphrase are used.
"""
from pathlib import Path
import json,os,shutil,socket,subprocess,time,traceback
from playwright.sync_api import sync_playwright,expect
ROOT=Path(__file__).resolve().parents[2];EVIDENCE=ROOT/'evidence';EVIDENCE.mkdir(exist_ok=True)
with socket.socket() as sock:sock.bind(('127.0.0.1',0));port=sock.getsockname()[1]
server=subprocess.Popen(['node','scripts/serve.mjs','dist',str(port)],cwd=ROOT,stdout=subprocess.DEVNULL)
url=f'http://127.0.0.1:{port}/';checks=[];status='failed';error='';start=time.time()
pw='test-only long passphrase 2026';secret='SYNTHETIC_PRIVATE_20260906'
def passed(name):checks.append({'name':name,'status':'passed'})
def unlock(page):
 page.get_by_label('解鎖密語',exact=True).fill(pw);page.get_by_role('button',name='解鎖私人日誌',exact=True).click();expect(page.locator('#quick-marked')).to_be_visible()
try:
 time.sleep(.5)
 with sync_playwright() as p:
  exe=os.environ.get('CHROMIUM_EXECUTABLE') or shutil.which('chromium')
  browser=p.chromium.launch(**({'executable_path':exe} if exe else {}),headless=True,args=['--no-sandbox'])
  context=browser.new_context(accept_downloads=True,timezone_id='Asia/Taipei');page=context.new_page();page.set_default_timeout(12000)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(url);expect(page.get_by_label('設定密語',exact=True)).to_be_visible();passed('native ESM loads under CSP from the local origin')
  page.get_by_label('設定密語',exact=True).fill(pw);page.get_by_label('再輸入一次密語',exact=True).fill(pw);page.get_by_label('我知道忘記密語無法找回，也會自行備份日誌',exact=True).check();page.get_by_role('button',name='建立加密日誌',exact=True).click();expect(page.locator('#quick-marked')).to_be_visible();passed('create encrypted IndexedDB vault')
  page.get_by_role('link',name='設定',exact=True).click();page.get_by_label('離開分頁時自動鎖定',exact=True).uncheck();page.get_by_role('link',name='今天',exact=True).click()
  page.locator('#quick-marked').click();page.get_by_role('button',name='補一項內容',exact=True).click();page.get_by_text('備註與選配語音',exact=True).click();page.get_by_label('想留下的其他內容',exact=True).fill(secret);page.get_by_role('button',name='今天先到這裡',exact=True).click();passed('autosave drains before navigation')
  raw=page.evaluate("async()=>{const m=await import('./src/lib/storage.js');return JSON.stringify(await m.readEnvelope())}")
  assert secret not in raw and 'ciphertext' in raw;passed('IndexedDB envelope contains ciphertext rather than note text')
  page.reload();unlock(page);page.get_by_role('button',name='補一項內容',exact=True).click();page.get_by_text('備註與選配語音',exact=True).click();expect(page.get_by_label('想留下的其他內容',exact=True)).to_have_value(secret);passed('reload and unlock restores encrypted note')
  page.get_by_role('link',name='我的資料',exact=True).click()
  with page.expect_download() as d:page.get_by_role('button',name='下載完整加密備份',exact=True).click()
  backup=EVIDENCE/'synthetic-test.qdays';d.value.save_as(backup);passed('download a complete encrypted backup')
  page.get_by_role('button',name='鎖定日誌',exact=True).click();page.get_by_label('解鎖密語',exact=True).fill('incorrect long passphrase');page.get_by_role('button',name='解鎖私人日誌',exact=True).click();expect(page.locator('#alert')).to_contain_text('無法解鎖');passed('wrong passphrase is rejected without erasing the vault')
  unlock(page)
  # Two independently unlocked tabs must never silently overwrite each other.
  second=context.new_page();second.goto(url);unlock(second)
  second.get_by_role('button',name='補一項內容',exact=True).click();second.get_by_text('備註與選配語音',exact=True).click()
  page.get_by_role('link',name='設定',exact=True).click();page.get_by_label('低能量模式',exact=True).uncheck();expect(page.locator('#status')).to_contain_text('偏好已儲存')
  second.get_by_label('想留下的其他內容',exact=True).fill('SYNTHETIC_STALE_WRITE');expect(second.locator('#alert')).to_contain_text('其他分頁');passed('cross-tab revision conflict rejects stale writes')
  second.close(run_before_unload=False)
  await_ready="async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(r=>navigator.serviceWorker.addEventListener('controllerchange',r,{once:true}));}"
  page.evaluate(await_ready);page.get_by_role('button',name='鎖定日誌',exact=True).click();context.set_offline(True);page.reload();unlock(page);passed('installed static shell reloads and unlocks offline');context.set_offline(False)
  page.get_by_role('link',name='我的資料',exact=True).click();page.get_by_role('button',name='開始刪除全部資料',exact=True).click();page.get_by_label('我理解此刪除無法復原',exact=True).check();page.get_by_role('button',name='確認永久刪除',exact=True).click();expect(page.get_by_label('設定密語',exact=True)).to_be_visible();passed('confirmed local deletion returns to empty vault')
  page.get_by_role('button',name='還原加密備份',exact=True).click();page.get_by_label('選擇加密備份',exact=True).set_input_files(backup);page.get_by_label('備份的原密語',exact=True).fill(pw);page.get_by_role('button',name='解密驗證並還原',exact=True).click();expect(page.locator('#quick-marked')).to_be_visible();passed('encrypted backup restores the deleted diary')
  assert not errors,str(errors);passed('no unhandled page errors in full served-origin flow')
  backup.unlink(missing_ok=True);browser.close();status='passed'
except Exception as e:
 error=str(e);status='blocked' if 'ERR_BLOCKED_BY_ADMINISTRATOR' in error else 'failed';traceback.print_exc()
finally:
 server.terminate();server.wait(timeout=5)
 report={'mode':'served-origin E2E; no mocks','status':status,'error':error,'seconds':round(time.time()-start,2),'checks':checks}
 (EVIDENCE/'browser-tests.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
 print(json.dumps(report,ensure_ascii=False));raise SystemExit(0 if status=='passed' else 2 if status=='blocked' else 1)
