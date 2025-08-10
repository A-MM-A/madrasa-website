//imports
import { io } from "https://cdn.socket.io/4.7.2/socket.io.esm.min.js"; // for mpesa webhook

// backend location
const BASE_URL = 'https://dar-al-arqam.onrender.com';

// open menu toggle - all files
const menuToggle = document.getElementById('menu-toggle');
const mainNav = document.getElementById('main-nav');
menuToggle.addEventListener('click', () => {
    mainNav.classList.toggle('open');
});



// ----------index page: start

// slideshow js in index.html file


// enroll popup - in index page 
function openEnrollModal(e) {
    e.preventDefault();
    document.getElementById('enrollModal').style.display = 'flex';
    document.body.classList.add('no-scroll');
}
function closeEnrollModal() {
    document.getElementById('enrollModal').style.display = 'none';
    document.body.classList.remove('no-scroll');
}
/* optional: close if click outside content */
document.addEventListener('DOMContentLoaded', function () {
    const modal = document.getElementById('enrollModal');

    if (!modal) return;

    modal.addEventListener('click', function (e) {
        if (e.target === modal) {
            closeEnrollModal();
        }
    });
});



// ----------index page: end




//file preview - in enroll form
// document.querySelectorAll('.file-preview').forEach(input => {
//     input.addEventListener('change', function () {
//         const previewId = this.dataset.preview;
//         const previewBox = document.getElementById(previewId);
//         const file = this.files[0];

//         if (!file) return;

//         const reader = new FileReader();
//         reader.onload = function (e) {
//             if (file.type.startsWith("image/")) {
//                 previewBox.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
//             } else if (file.type === "application/pdf") {
//                 previewBox.innerHTML = `<iframe src="${e.target.result}" width="100%" height="400px"></iframe>`;
//             } else {
//                 previewBox.innerHTML = `<p>Preview not supported for this file type.</p>`;
//             }
//         };
//         reader.readAsDataURL(file);
//     });
// });





//fee price pop up - in enroll form
function showPricingPopup(event) {
    event.preventDefault();
    document.body.classList.add('popup-open');
    document.getElementById('pricingPopup').style.display = 'flex';
}

function closePricingPopup() {
    document.getElementById('pricingPopup').style.display = 'none';
    document.body.classList.remove('popup-open');
}








// // mpesa stuff
// function openRules() { document.getElementById('rulesModal').style.display = 'block'; }
// function closeRules() { document.getElementById('rulesModal').style.display = 'none'; }

// function openWaiting() { document.getElementById('waitingModal').style.display = 'block'; }
// function closeWaiting() { document.getElementById('waitingModal').style.display = 'none'; }

// function openSuccess() { document.getElementById('successModal').style.display = 'block'; }
// function closeSuccess() {
//     document.getElementById('successModal').style.display = 'none';
//     setTimeout(() => {
//         window.location.href = "index.html";
//     }, 300);
// }

// function openFailure() { document.getElementById('failureModal').style.display = 'flex'; }
// function closeFailure() { document.getElementById('failureModal').style.display = 'none'; }

// // Step 1: User clicks Confirm
// document.getElementById('confirmBtn').addEventListener('click', openRules);
// // document.getElementById('confirmBtn').addEventListener('click', submitForm);


// // Step 2: Rules form submit
// document.getElementById('rulesSubmit').addEventListener('click', () => {
//     const phone = document.getElementById('rulesMpesaNumber').value.trim();
//     const errorSmall = document.getElementById('phoneError');

//     if (!phone) {
//         errorSmall.style.display = 'block';
//         return;
//     }

//     errorSmall.style.display = 'none';
//     closeRules();
//     startPayment(phone);
// });

// Step 3: startPayment does the STK push and manages popups
async function startPayment(phone) {
    // show waiting
    openWaiting();
    try {
        const paymentData = { phone, amount: 1, accountReference: 'DarAdmission-' + Date.now() };
        const res = await fetch(`${BASE_URL}/api/mpesa/stkpush`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(paymentData)
        });
        const json = await res.json();
        if (!json.status) throw new Error(json.msg || 'STK failed');
        const checkoutID = json.checkoutRequestID;

        // poll for up to 12 attempts:
        for (let i = 0; i < 12; i++) {
            await new Promise(r => setTimeout(r, 3000));
            const stat = await fetch(
                `${BASE_URL}/api/mpesa/payment-status?checkoutRequestID=${checkoutID}`
            ).then(r => r.json());

            // success
            if (stat.paid) {

                // send email
                const formData = await collectFormData();
                const emailRes = await fetch(`${BASE_URL}/api/email/email-pdf`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                const emailJson = await emailRes.json();
                if (!emailJson.sent) console.error('Email failed:', emailJson.error);

                closeWaiting();
                openSuccess();

                // download choice
                const dl = document.getElementById('downloadPdf');
                dl.onclick = () => {
                    closeSuccess();
                    // download via your existing /generate-pdf endpoint:
                    submitForm();
                    dl.disabled = true;
                };
                return;
            }
        }

        // timeout
        throw new Error('Timeout waiting for payment');
    } catch (err) {
        console.error(err);
        closeWaiting();
        openFailure();
    }
}

// // Step 4: retries
// document.getElementById('retryPay').addEventListener('click', () => {
//     closeFailure();
//     openRules();
// });

// // Step 5: report issue
// document.getElementById('reportIssue').addEventListener('click', () => {
//     closeFailure();
//     //issue code
//     alert('We’ll send you a prompt to upload proof of payment…');
// });




// -------------------------------------   Mpesa function --------------------------------------
/**
 * requestMpesaPay(amount, accountReference, support, onSuccess, redirectUrl = '#')
 *
 * Usage examples:
 *   requestMpesaPay(500, 'malindi trip', '254700352862' 'hi()');
 *   requestMpesaPay(1000, 'course fee', '254786367536' updateDb, 'thank-you.html');
 */
async function requestMpesaPay(amount, accountReference, support, onSuccess, redirectUrl = '#') {
    if (typeof amount !== 'number' || amount <= 0) throw new Error('Amount must be a positive number');
    if (!accountReference || typeof accountReference !== 'string') accountReference = String(accountReference || 'Payment');

    // Configurable internals
    const POLL_INTERVAL_MS = 3000; // 3s between polls
    const MAX_POLL_ATTEMPTS = 10; // ~30 seconds total
    const MODAL_IDS = {
        rules: 'rulesModal',
        waiting: 'waitingModal',
        success: 'successModal',
        failure: 'failureModal',
        phoneInput: 'rulesMpesaNumber',
        phoneError: 'phoneError',
        submitBtn: 'rulesSubmit',
        retryBtn: 'retryPay',
        reportBtn: 'reportIssue',
        successActionBtn: 'successAction',
        successCloseBtn: 'successClose'
    };

    // Helper: try to resolve the onSuccess argument safely
    function runSuccessCallback() {
        try {
            if (typeof onSuccess === 'function') {
                onSuccess();
                return true;
            }
            if (typeof onSuccess === 'string') {
                // Accept "fnName", "fnName()", or "someCode();"
                const trimmed = onSuccess.trim();
                // If it's a plain function call like "updateDb()" or "updateDb", extract name
                const m = trimmed.match(/^([A-Za-z_$][A-Za-z0-9_$]*)\s*(\(\))?$/);
                if (m) {
                    const fnName = m[1];
                    const fn = window[fnName];
                    if (typeof fn === 'function') {
                        fn();
                        return true;
                    }
                }
                // Last resort: evaluate the string as code (use cautiously)
                try {
                    new Function(trimmed)();
                    return true;
                } catch (e) {
                    console.error('Failed to execute callback string safely:', e);
                }
            }
        } catch (e) {
            console.error('Error running success callback:', e);
        }
        return false;
    }

    // Basic Kenyan phone normalization/validation
    function normalizePhone(raw) {
        if (!raw) return null;
        let s = raw.replace(/[^\d+]/g, '');
        // Common input forms: 07XXXXXXXX, 7XXXXXXXX, +2547XXXXXXXX, 2547XXXXXXXX
        if (s.startsWith('+')) s = s.slice(1);
        // If it begins with 0 and length 10 -> replace leading 0 with 254
        if (/^0\d{9}$/.test(s)) return '254' + s.slice(1);
        if (/^[1-9]\d{8}$/.test(s) && s.length === 9) return '254' + s; // maybe user typed 7XXXXXXXX
        if (/^2547\d{8}$/.test(s)) return s;
        if (/^7\d{8}$/.test(s)) return '254' + s;
        return null;
    }

    // ===== Create or reuse DOM modals =====
    // If modals already exist in DOM, reuse them. Otherwise create from templates below.
    function ensureDom() {
        // only create once
        if (document.getElementById(MODAL_IDS.rules)) return;

        // Styles: we assume you already have your CSS. The template uses the same ids/classes you posted.
        const wrapper = document.createElement('div');
        wrapper.innerHTML = `
      <!-- RULES / PHONE INPUT -->
      <div id="${MODAL_IDS.rules}" style="display:none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 9999; font-family: Arial, sans-serif; align-items:center; justify-content:center;">
        <div style="background-color: #f2fef4; border: 2px solid #2e7d32; border-radius: 15px; padding: 2rem; max-width: 420px; margin: auto; text-align: center; box-shadow: 0 8px 20px rgba(0,0,0,0.2);">
          <h1 style="color: #2e7d32; margin-bottom: 0.5rem;">Payment</h1>
          <h4 style="color: #444; margin-top: 0;">Please Read Carefully!</h4>
          <ul style="color: #555; text-align: left; font-size: 0.9rem; margin: 1rem 0; padding-left: 20px; line-height: 1.5;">
            <li><b style="color: red;">DO NOT</b> press back or reload.</li>
            <li>Enter your M-Pesa PIN on your phone when prompted.</li>
            <li>Payment amount is <b>non-refundable</b>.</li>
          </ul>
          <div style="background: #e8f5e9; padding: 15px; border-radius: 12px; display: flex; align-items: center; justify-content: center; gap: 10px; margin: 15px 0;">
            <div style="flex-shrink: 0;">
              <img src="media/mpesa-logo.png" alt="M-Pesa Logo" style="width: 70px;">
            </div>
            <div style="flex: 1;">
              <label style="font-size: 0.9rem; color: #2e7d32; font-weight: bold;">Lipa na M-Pesa</label>
              <input type="tel" id="${MODAL_IDS.phoneInput}" placeholder="e.g. 07XXXXXXXX" required style="width: 100%; padding: 10px; margin-top: 5px; border: 1px solid #ccc; border-radius: 6px; font-size: 1rem;">
              <small id="${MODAL_IDS.phoneError}" style="color: red; font-size: 0.8rem; margin-top: 4px; display: none;">Please enter a valid M-Pesa number.</small>
            </div>
          </div>
          <div style="margin-top: 15px;">
            <button id="mpesaCancel" style="background-color: #fbe9e7; border: 1px solid #ff5722; color: #d84315; padding: 10px 18px; border-radius: 6px; cursor: pointer; font-weight: bold; margin-right: 5px;">Cancel</button>
            <button id="${MODAL_IDS.submitBtn}" style="background-color: #66bb6a; border: 1px solid #388e3c; color: white; padding: 10px 18px; border-radius: 6px; cursor: pointer; font-weight: bold;">Submit</button>
          </div>
        </div>
      </div>

      <!-- WAITING -->
      <div id="${MODAL_IDS.waiting}" style="display:none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 9999; align-items:center; justify-content:center;">
        <div class="popup-content mpesa-style" style="display:block;">
          <div class="spinner" style="margin:1rem auto; width:48px; height:48px; border:6px solid #eee; border-top:6px solid #2e7d32; border-radius:50%; animation: spin 1s linear infinite;"></div>
          <h2>Waiting for Confirmation</h2>
          <p style="color: gray;">Enter M-Pesa PIN on your phone. <br> Please do <b>NOT</b> close this window.<br> You can Retry Payment after 30 seconds.</p>
        </div>
      </div>

      <!-- SUCCESS -->
      <div id="${MODAL_IDS.success}" style="display:none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 9999; align-items:center; justify-content:center;">
        <div class="popup-content mpesa-style" style="display:block;">
          <div class="checkmark" style="font-size:3rem;color:green;">✔</div>
          <h2>Payment Successful!</h2>
          <p id="successDetail" style="color: gray;">Thank you <br> payment confirmed.</p>
          <div style="margin-top:12px;">
            <button id="${MODAL_IDS.successCloseBtn}" style="background-color: #fbe9e7; border: 1px solid #ff5722; color: #d84315; padding: 10px 18px; border-radius: 6px; cursor: pointer; font-weight: bold; margin-right: 5px;">Close</button>
            <button id="${MODAL_IDS.successActionBtn}" style="background-color: #66bb6a; border: 1px solid #388e3c; color: white; padding: 10px 18px; border-radius: 6px; cursor: pointer; font-weight: bold;">Proceed</button>
          </div>
        </div>
      </div>

      <!-- FAILURE -->
      <div id="${MODAL_IDS.failure}" style="display:none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 9999; align-items:center; justify-content:center;">
        <div class="popup-content mpesa-style" style="display:block;">
          <div class="failmark" style="font-size:3rem;color:red;">✖</div>
          <h2>Payment Failed</h2>
          <p id="failureDetail" style="color: gray;">Something went wrong.<br> Try again.</p>
          <div style="margin-top:12px;">
            <button id="failureClose" style="background-color: #fbe9e7; border: 1px solid #ff5722; color: #d84315; padding: 10px 18px; border-radius: 6px; cursor: pointer; font-weight: bold; margin-right: 5px;">Close</button>
            <button id="${MODAL_IDS.retryBtn}" style="background-color: #66bb6a; border: 1px solid #388e3c; color: white; padding: 10px 18px; border-radius: 6px; cursor: pointer; font-weight: bold;">Try Again</button>
            <button id="${MODAL_IDS.reportBtn}" style="background-color: #fbe9e7; border: 1px solid #388e3c; color: #333; padding: 10px 18px; border-radius: 6px; cursor: pointer; font-weight: bold; margin-left:8px;">I Paid But Didn’t See Confirmation</button>
          </div>
        </div>
      </div>
    `;

        document.body.appendChild(wrapper);

        // small helper for spin keyframes (in case not in CSS)
        const styleTag = document.createElement('style');
        styleTag.textContent = `
      @keyframes spin { to { transform: rotate(360deg); } }
      .mpesa-style { background-color: #f2fef4; border: 2px solid #2e7d32; border-radius: 10px; padding: 2rem; text-align: center; max-width: 400px; margin: auto; }
    `;
        document.head.appendChild(styleTag);

        // numbers only validator on number field
        const input = document.getElementById(MODAL_IDS.phoneInput);
        if (input) {
            input.addEventListener('input', function () {
                this.value = this.value.replace(/[^0-9]/g, '');
            });
        }

        // Attach a couple of simple button handlers (some are set during flow)
        document.getElementById('mpesaCancel').addEventListener('click', () => {
            hideModal(MODAL_IDS.rules);
        });
        document.getElementById('failureClose').addEventListener('click', () => {
            hideModal(MODAL_IDS.failure);
        });
        document.getElementById(MODAL_IDS.reportBtn).addEventListener('click', () => {
            hideModal(MODAL_IDS.failure);

            // Get the phone number from the input field
            const phoneInputValue = document.getElementById(MODAL_IDS.phoneInput).value.trim();


            const now = new Date();
            const formattedDateTime = now.getFullYear() + '-' +
                String(now.getMonth() + 1).padStart(2, '0') + '-' +
                String(now.getDate()).padStart(2, '0') + ' ' +
                String(now.getHours()).padStart(2, '0') + ':' +
                String(now.getMinutes()).padStart(2, '0') + ':' +
                String(now.getSeconds()).padStart(2, '0');

            const message = encodeURIComponent(`
*Payement Error*\n
> Payement was made for [${accountReference}], 
> Amount [KSH: ${amount}],
> But no update has been received. Need Customer Support.
> Support: +${support}.\n
*Client Information*\n
> Mpesa Payment NO. ${phoneInputValue},
> Reported on: ${formattedDateTime}.\n
*Admin Details: Fn REQ {:{${onSuccess}}:}*\n
                `);
            const phoneNumber = support;

            // Open WhatsApp in a new tab
            window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
        });
    }

    function showModal(id) {
        const el = document.getElementById(id);
        if (!el) return;
        el.style.display = (id === MODAL_IDS.rules) ? 'flex' : 'flex';
        // center
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
    }
    function hideModal(id) {
        const el = document.getElementById(id);
        if (!el) return;
        el.style.display = 'none';
    }

    ensureDom();

    // hook submit button behavior
    const submitBtn = document.getElementById(MODAL_IDS.submitBtn);
    submitBtn.onclick = async function () {
        const rawPhone = document.getElementById(MODAL_IDS.phoneInput).value.trim();
        const normalized = normalizePhone(rawPhone);
        const errEl = document.getElementById(MODAL_IDS.phoneError);
        if (!normalized) {
            errEl.style.display = 'block';
            errEl.textContent = 'Please enter a valid M-Pesa number (07XXXXXXXX or 2547XXXXXXXX).';
            return;
        }
        errEl.style.display = 'none';
        hideModal(MODAL_IDS.rules);
        try {
            await runPaymentFlow(normalized);
        } catch (err) {
            console.error('Payment flow error:', err);
            document.getElementById('failureDetail').textContent = err.message || 'Payment failed';
            showModal(MODAL_IDS.failure);
        }
    };

    // retry behavior
    document.getElementById(MODAL_IDS.retryBtn).onclick = () => {
        hideModal(MODAL_IDS.failure);
        showModal(MODAL_IDS.rules);
    };

    // success modal buttons
    document.getElementById(MODAL_IDS.successCloseBtn).onclick = () => {
        // Go to index.html when they close success modal
        window.location.href = 'index.html';
    };
    document.getElementById(MODAL_IDS.successActionBtn).onclick = () => {
        // Run callback THEN redirect to redirectUrl
        const ok = runSuccessCallback();
        if (!ok) console.warn('Callback did not run or was not found.');
        // small delay so the callback has a chance to run (if async it should handle its own promises)
        setTimeout(() => {
            window.location.href = redirectUrl || 'courses.html';
        }, 200);
    };

    // show the rules/phone popup to begin
    showModal(MODAL_IDS.rules);

    // core payment flow (STK push + poll)
    async function runPaymentFlow(phone) {
        showModal(MODAL_IDS.waiting);

        // prepare payload
        const payload = {
            phone,
            amount,
            accountReference: `${accountReference}-${Date.now()}`
        };


        // disable submit button during network call
        try {
            const res = await fetch(`${BASE_URL}/api/mpesa/stkpush`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const json = await res.json();
            if (!json || !json.status) {
                hideModal(MODAL_IDS.waiting);
                throw new Error(json && json.msg ? json.msg : 'STK Push initiation failed');
            }

            const checkoutRequestID = json.checkoutRequestID || json.CheckoutRequestID || json.checkoutId;
            if (!checkoutRequestID) {
                hideModal(MODAL_IDS.waiting);
                throw new Error('No checkoutRequestID returned from backend.');
            }

            // // Poll for payment status
            // let paid = false;
            // let lastStatus = null;
            // for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
            //     // wait
            //     await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
            //     try {
            //         const statusRes = await fetch(`${BASE_URL}/api/mpesa/payment-status?checkoutRequestID=${encodeURIComponent(checkoutRequestID)}`);
            //         const statusJson = await statusRes.json();
            //         lastStatus = statusJson;
            //         if (statusJson && statusJson.paid) {
            //             paid = true;
            //             break;
            //         }
            //         // Optional: if backend returns an explicit failed status, break early
            //         if (statusJson && statusJson.status && statusJson.status.toLowerCase() === 'failed') {
            //             lastStatus = statusJson;
            //             break;
            //         }
            //     } catch (e) {
            //         console.warn('Poll error (ignored):', e);
            //     }
            // }

            // ✅ NEW: Listen for webhook update instead of polling
            // const socket = io(BASE_URL);
            const socket = io(BASE_URL, { transports: ["websocket"] });
            socket.emit("joinPayment", checkoutRequestID);

            const paymentResult = await new Promise((resolve, reject) => {
                socket.on("paymentStatus", (data) => {
                    resolve(data);
                    socket.disconnect();
                });

                // Optional: Timeout fallback (same as MAX_POLL_ATTEMPTS * POLL_INTERVAL_MS)
                setTimeout(() => {
                    reject(new Error("Timeout waiting for payment confirmation."));
                    socket.disconnect();
                }, MAX_POLL_ATTEMPTS * POLL_INTERVAL_MS);
            });


            hideModal(MODAL_IDS.waiting);

            
            if (paymentResult.paid) {
                // Optional: If you have a collectFormData() or email endpoint, call it here
                if (typeof window.collectFormData === 'function') {
                    try {
                        const formData = await window.collectFormData();
                        if (formData) {
                            // try to send email/pdf silently; backend might reject but we continue
                            try {
                                await fetch(`${BASE_URL.replace(/\/$/, '')}/api/email/email-pdf`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(formData)
                                });
                            } catch (e) { console.warn('Email step failed', e); }
                        }
                    } catch (e) { console.warn('collectFormData() failed', e); }
                }

                // show success modal
                document.getElementById('successDetail').textContent = `Payment confirmed (${amount} KES). Thank you.`;
                showModal(MODAL_IDS.success);
                return Promise.resolve(lastStatus);
            }

            // timed out or failure
            document.getElementById('failureDetail').textContent = lastStatus && lastStatus.msg ? lastStatus.msg : 'Timeout waiting for payment confirmation.';
            showModal(MODAL_IDS.failure);
            throw new Error('Timeout or failed payment.');
        } catch (err) {
            hideModal(MODAL_IDS.waiting);
            showModal(MODAL_IDS.failure);
            throw err;
        }
    }

}




async function hi() {
    // alert("hi error");
    const message = encodeURIComponent(`
*Payement Error*,\n
> Payement was made for [${accountReference}], Amount [${amount}],
> But no update has been received. Need Customer Support.
> Support: ${support},\n

*Admin Details: Fn REQ {:${onSuccess}:}*
`);
    const phoneNumber = "254707352862";

    // Open WhatsApp in a new tab
    await window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');

}

// hi();

