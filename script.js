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




// ----------enroll page: start
// next steps and previous in forms - in enroll form 
const steps = document.querySelectorAll(".form-step");
const indicators = document.querySelectorAll(".step-indicator li");
let currentStep = 0;

function showStep(index) {
    steps.forEach((step, i) => {
        step.classList.toggle("active", i === index);
        indicators[i].classList.toggle("current", i === index);
        if (i < index) indicators[i].classList.add("completed");
        else indicators[i].classList.remove("completed");
        indicators[i].classList.toggle("disabled", i > currentStep);
    });
}

function nextStep() {
    const inputs = steps[currentStep].querySelectorAll("input");
    for (const input of inputs) {
        if (!input.checkValidity()) {
            input.reportValidity();
            return;
        }
    }
    currentStep++;
    showStep(currentStep);

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function prevStep() {
    currentStep--;
    showStep(currentStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goToStep(index) {
    if (index <= currentStep) {
        currentStep = index;
        showStep(index);
    }
}


//if chooses yes in medical info - in enroll form
document.addEventListener("DOMContentLoaded", function () {
    const medicalSelect = document.getElementById("medical");
    const medicalInfoGroup = document.getElementById("medical-info-group");

    if (medicalSelect && medicalInfoGroup) {
        medicalSelect.addEventListener("change", function () {
            if (medicalSelect.value === "1") {
                medicalInfoGroup.style.display = "block";
            } else {
                medicalInfoGroup.style.display = "none";
            }
        });
    }
});


//file preview - in enroll form
document.querySelectorAll('.file-preview').forEach(input => {
    input.addEventListener('change', function () {
        const previewId = this.dataset.preview;
        const previewBox = document.getElementById(previewId);
        const file = this.files[0];

        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (e) {
            if (file.type.startsWith("image/")) {
                previewBox.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
            } else if (file.type === "application/pdf") {
                previewBox.innerHTML = `<iframe src="${e.target.result}" width="100%" height="400px"></iframe>`;
            } else {
                previewBox.innerHTML = `<p>Preview not supported for this file type.</p>`;
            }
        };
        reader.readAsDataURL(file);
    });
});


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


// Final submission: generate and download PDF
// ---------------------- FILE VALIDATION -----------------------
// show a centered modal with green-white theme


function showModal(message) {
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0'; overlay.style.left = '0';
    overlay.style.width = '100%'; overlay.style.height = '100%';
    overlay.style.background = 'rgba(0,0,0,0.4)';
    overlay.style.display = 'flex'; overlay.style.alignItems = 'center'; overlay.style.justifyContent = 'center';
    const box = document.createElement('div');
    box.style.background = 'white'; box.style.color = 'var(--primary-green)';
    box.style.padding = '1.5rem'; box.style.borderRadius = '8px';
    box.style.maxWidth = '80%'; box.style.textAlign = 'center';
    box.innerText = message;
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    setTimeout(() => document.body.removeChild(overlay), 3000);
}

function validateFile(inputEl, allowedTypes, maxMB) {
    const file = inputEl.files[0];
    const previewBox = document.getElementById(inputEl.dataset.preview);
    if (!file) return true;
    if (!allowedTypes.includes(file.type)) {
        showModal(`\"${file.name}\" must be one of: ${allowedTypes.join(', ')}`);
        inputEl.value = '';
        if (previewBox) previewBox.innerHTML = '';
        return false;
    }
    if (file.size > maxMB * 1024 * 1024) {
        showModal(`\"${file.name}\" exceeds ${maxMB}MB.`);
        inputEl.value = '';
        if (previewBox) previewBox.innerHTML = '';
        return false;
    }
    return true;
}

document.getElementById('birth').addEventListener('change', e => {
    validateFile(e.target, ['application/pdf'], 4);
});
document.getElementById('repID').addEventListener('change', e => {
    validateFile(e.target, ['application/pdf'], 4);
});
document.getElementById('photo').addEventListener('change', e => {
    validateFile(e.target, ['image/png', 'image/jpeg'], 4);
});
document.getElementById('vaccine').addEventListener('change', e => {
    validateFile(e.target, ['application/pdf', 'image/png', 'image/jpeg'], 4);
});

globalThis.enrollmentData = {}; // temp store form d

// helper to read a file input as base64 string (without data: prefix)
function readFileAsBase64(inputEl) {
    return new Promise(resolve => {
        const file = inputEl.files[0];
        if (!file) return resolve(null);
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(file);
    });
}

// ---------------------- SUBMIT FORM -----------------------

// data from frontend to the back
async function collectFormData() {
    const data = {
        fullName: document.getElementById('fullName')?.value || '',
        birthDate: document.getElementById('birthDate')?.value || '',
        gender: document.getElementById('gender')?.value || '',
        address: document.getElementById('Address')?.value || '',
        nationality: document.getElementById('nation')?.value || '',
        studentemail: document.getElementById('studentemail')?.value || '',
        studentPhone: document.getElementById('studentPhone')?.value || '',
        representative: document.getElementById('representative')?.value || '',
        guardianname: document.getElementById('guardianname')?.value || '',
        guardianGender: document.getElementById('guardianGender')?.value || '',
        Occupation: document.getElementById('Occupation')?.value || '',
        GuardianAddress: document.getElementById('GuardianAddress')?.value || '',
        GuardianNationality: document.getElementById('GuardianNationality')?.value || '',
        id: document.getElementById('id')?.value || '',
        guardianPhone: document.getElementById('guardianPhone')?.value || '',
        email: document.getElementById('email')?.value || '',
        medical: document.getElementById('medical')?.value || '',
        medical_info: document.getElementById('medical-info')?.value || ''
    };

    data.photoBase64 = await readFileAsBase64(document.getElementById('photo'));
    data.birthCertBase64 = await readFileAsBase64(document.getElementById('birth'));
    data.repIDBase64 = await readFileAsBase64(document.getElementById('repID'));
    data.vaccineBase64 = await readFileAsBase64(document.getElementById('vaccine'));

    return data;
}

// ---------------------- GENERATE & DOWNLOAD PDF -----------------------
async function submitForm() {
    try {
        // 1) Collect all the form data & files
        const data = await collectFormData();

        // 2) POST to your backend to generate the PDF
        const res = await fetch('http://localhost:3000/generate-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Server error');

        // 3) Download the PDF
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'enrollment.pdf';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        showModal('Your PDF has downloaded 🎉');


        // 4) Email the PDF
        const reader = new FileReader();
        reader.onload = async () => {
            const base64 = reader.result.split(',')[1];
            await fetch('http://localhost:3000/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pdfBase64: base64,
                    guardianEmail: document.getElementById('email').value.trim()
                })
            });
            showModal('✅ Your form has been emailed to you. Thank you!');
        };
        reader.readAsDataURL(blob);


    } catch (err) {
        console.error('Download error:', err);
        showModal('❌ Failed to download PDF. Please try again.');
    }
}

// Make it globally callable from the success popup
window.submitForm = submitForm;


// mpesa stuff
function openRules() { document.getElementById('rulesModal').style.display = 'flex'; }
function closeRules() { document.getElementById('rulesModal').style.display = 'none'; }

function openWaiting() { document.getElementById('waitingModal').style.display = 'flex'; }
function closeWaiting() { document.getElementById('waitingModal').style.display = 'none'; }

function openSuccess() { document.getElementById('successModal').style.display = 'flex'; }
function closeSuccess() { document.getElementById('successModal').style.display = 'none'; }

function openFailure() { document.getElementById('failureModal').style.display = 'flex'; }
function closeFailure() { document.getElementById('failureModal').style.display = 'none'; }

// Step 1: User clicks Confirm
document.getElementById('confirmBtn').addEventListener('click', openRules);

// Step 2: Rules form submit
document.getElementById('rulesSubmit').addEventListener('click', () => {
    const phone = document.getElementById('rulesMpesaNumber').value.trim();
    if (!phone) return alert('Enter your M‑Pesa number');
    closeRules();
    startPayment(phone);
});

// Step 3: startPayment does the STK push and manages popups
async function startPayment(phone) {
    // show waiting
    openWaiting();
    try {
        const paymentData = { phone, amount: 1, accountReference: 'DarAdmission-' + Date.now() };
        const res = await fetch('http://localhost:3000/api/stkpush', {
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
                `http://localhost:3000/api/payment-status?checkoutRequestID=${checkoutID}`
            ).then(r => r.json());

            // success
            if (stat.paid) {
                closeWaiting();

                // send email
                const formData = await collectFormData();
                fetch('http://localhost:3000/email-pdf', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                })
                    .then(r => r.json())
                    .then(json => {
                        if (!json.emailed) console.error('Email failed:', json.error);
                    })
                    .catch(err => console.error('Email error:', err));

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

// Step 4: retries
document.getElementById('retryPay').addEventListener('click', () => {
    closeFailure();
    openRules();
});

// Step 5: report issue
document.getElementById('reportIssue').addEventListener('click', () => {
    closeFailure();
    //issue code
    alert('We’ll send you a prompt to upload proof of payment…');
});


// ----------enroll page: end