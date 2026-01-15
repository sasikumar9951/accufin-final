// Simple birthday wish email template
export function birthdayWishTemplate({ name }: { name?: string }) {
  return {
    subject: "Happy Birthday from Accufin!",
    html: `
      <div style="background-color:#f7f9fa; padding:24px; font-family: Arial, sans-serif;">
        <div style="max-width:560px; margin:0 auto; background-color:#ffffff; border-radius:12px; box-shadow:0 2px 4px rgba(0,0,0,0.08); overflow:hidden;">
          <div style="background: linear-gradient(90deg, #008db3, #00bcd4); padding:14px 20px;">
            <p style="margin:0; color:#e8fbff; font-size:12px; letter-spacing:0.4px;">AccuFin • Special Day</p>
          </div>

          <div style="padding:28px 24px 8px 24px; text-align:center;">
            <h1 style="margin:0 0 8px 0; color:#0a2236; font-size:24px;">
              🎉 Happy Birthday${name ? ", " + name : ""}!
            </h1>
            <p style="margin:0; color:#5a6a7a; font-size:14px; line-height:22px;">
              Wishing you a joyful day and a fantastic year ahead. Thank you for being a valued member of the AccuFin family.
            </p>
          </div>

          <hr style="border:none; border-top:1px solid #e1e5e9; margin:20px 24px;" />

          <div style="padding:0 24px 24px 24px;">
            <div style="background:#f7f9fa; border:1px solid #e1e5e9; border-radius:10px; padding:16px;">
              <p style="margin:0; color:#0a2236; font-size:14px; line-height:22px;">
                May your day be filled with success, laughter, and great memories. If there's anything we can do to make your year even better, we're here for you.
              </p>
            </div>
          </div>

          <div style="padding:0 24px 28px 24px; text-align:center;">
            <p style="margin:0; color:#5a6a7a; font-size:12px; font-style:italic;">
              — The AccuFin Team
            </p>
          </div>
        </div>
      </div>
    `,
  };
}
