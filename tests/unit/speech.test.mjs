import test from 'node:test';
import assert from 'node:assert/strict';
import {localSpeechSupport,localSpeechStatus,startLocalDictation} from '../../src/lib/speech.js';
test('no recognizer means no microphone start or cloud fallback',async()=>{globalThis.window={};assert.equal(localSpeechSupport(),null);assert.equal(await localSpeechStatus(),'unsupported');await assert.rejects(()=>startLocalDictation(()=>{},()=>{},()=>{}));delete globalThis.window;});
test('legacy cloud-only speech implementation is rejected',async()=>{globalThis.window={webkitSpeechRecognition:class Legacy{}};assert.equal(localSpeechSupport(),null);delete globalThis.window;});
test('local availability query always explicitly requests local zh-TW',async()=>{let args;class Local{constructor(){this.processLocally=false;}static async available(a){args=a;return 'unavailable';}}globalThis.window={SpeechRecognition:Local};assert.equal(await localSpeechStatus(),'unavailable');assert.deepEqual(args,{langs:['zh-TW'],processLocally:true});await assert.rejects(()=>startLocalDictation(()=>{},()=>{},()=>{}));delete globalThis.window;});
