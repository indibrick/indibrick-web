import Script from 'next/script';

/**
 * TrustedForm certificate loader. Drop on every page that has a lead-capture form
 * (`/`, `/contact`, `/apply`, `/rates`). It populates any `#xxTrustedFormCertUrl`
 * hidden input on the page with the consent-certificate URL at submit time.
 */
export default function TrustedFormScript() {
  return (
    <Script id="trustedform-loader" strategy="afterInteractive">
      {`(function() {
  var field = 'xxTrustedFormCertUrl';
  var provideReferrer = false;
  var invertFieldSensitivity = false;
  var tf = document.createElement('script');
  tf.type = 'text/javascript'; tf.async = true;
  tf.src = 'https://api.trustedform.com/trustedform.js?provide_referrer=' + provideReferrer + '&field=' + field + '&l=' + new Date().getTime() + Math.random() + '&invert_field_sensitivity=' + invertFieldSensitivity;
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(tf, s);
})();`}
    </Script>
  );
}
