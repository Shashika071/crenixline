import nodemailer from 'nodemailer';

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'crexline@gmail.com',
        pass: 'ldii idvq myml uezp'
      }
    });

    this.alertEmail = 'crexline@gmail.com';
  }

  async sendLowStockAlert(materials) {
    if (!materials || materials.length === 0) {
      console.log('No low stock materials to alert');
      return { success: true, message: 'No low stock items found' };
    }

    const htmlContent = `
      <h2>Low Stock Alert</h2>
      <p>The following materials are below reorder level:</p>
      <table border="1" style="border-collapse: collapse; width: 100%;">
        <thead>
          <tr style="background-color: #f8f9fa;">
            <th style="padding: 8px; text-align: left;">Material</th>
            <th style="padding: 8px; text-align: left;">SKU</th>
            <th style="padding: 8px; text-align: left;">Current Stock</th>
            <th style="padding: 8px; text-align: left;">Reorder Level</th>
          </tr>
        </thead>
        <tbody>
          ${materials.map(material => `
            <tr>
              <td style="padding: 8px;">${material.name}</td>
              <td style="padding: 8px;">${material.sku}</td>
              <td style="padding: 8px; color: red; font-weight: bold;">${material.availableQty}</td>
              <td style="padding: 8px;">${material.reorderLevel}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <p>Please take necessary action to replenish stock.</p>
    `;

    return this.sendEmail({
      to: this.alertEmail,
      subject: `Low Stock Alert - ${materials.length} Items Need Attention`,
      html: htmlContent
    });
  }

  async sendMaintenanceAlert(machines) {
    if (!machines || machines.length === 0) {
      console.log('No maintenance alerts to send');
      return { success: true, message: 'No maintenance alerts found' };
    }

    const htmlContent = `
      <h2>Maintenance Alert</h2>
      <p>The following machines require maintenance:</p>
      <table border="1" style="border-collapse: collapse; width: 100%;">
        <thead>
          <tr style="background-color: #f8f9fa;">
            <th style="padding: 8px; text-align: left;">Machine</th>
            <th style="padding: 8px; text-align: left;">Model</th>
            <th style="padding: 8px; text-align: left;">Status</th>
            <th style="padding: 8px; text-align: left;">Next Maintenance</th>
          </tr>
        </thead>
        <tbody>
          ${machines.map(machine => `
            <tr>
              <td style="padding: 8px;">${machine.name}</td>
              <td style="padding: 8px;">${machine.model}</td>
              <td style="padding: 8px; color: orange; font-weight: bold;">${machine.status}</td>
              <td style="padding: 8px;">${new Date(machine.nextMaintenance).toLocaleDateString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <p>Please schedule maintenance as soon as possible.</p>
    `;

    return this.sendEmail({
      to: this.alertEmail,
      subject: `Maintenance Alert - ${machines.length} Machines Need Attention`,
      html: htmlContent
    });
  }

  async sendEmail({ to, subject, html }) {
    try {
      const mailOptions = {
        from: 'crexline@gmail.com',
        to,
        subject,
        html
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending email:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new EmailService();