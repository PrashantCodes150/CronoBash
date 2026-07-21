"use client";

import React from 'react';
import { Download } from 'lucide-react';

interface SessionReportPDFProps {
  roomName: string;
  roomType: string;
  durationMinutes: number;
  focusScore: number;
  effectiveFocusSeconds: number;
  distractions: number;
  distractionCounts: {
    'hand-down': number;
    'gaze-away': number;
    'eye-closed': number;
    'face-absent': number;
    'static-frame': number;
  };
}

export function SessionReportPDF({
  roomName,
  roomType,
  durationMinutes,
  focusScore,
  effectiveFocusSeconds,
  distractions,
  distractionCounts
}: SessionReportPDFProps) {
  
  const handlePrint = () => {
    // Generate HTML report structure for print window
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const totalSeconds = durationMinutes * 60;
    const focusRatio = totalSeconds > 0 ? (effectiveFocusSeconds / totalSeconds) * 100 : 0;
    
    // Suggest tips based on distraction records
    let tips = "Great job staying consistent! Focus on matching this duration next time.";
    if (distractionCounts['gaze-away'] > 3) {
      tips = "Tip: Minimize side distractions by turning off second screens and browser tabs.";
    } else if (distractionCounts['hand-down'] > 3) {
      tips = "Tip: Maintain an upright posture and keep elbows off the desk to avoid triggering fatigue alerts.";
    } else if (distractionCounts['eye-closed'] > 2) {
      tips = "Tip: Take micro-sprints and get adequate sleep before entering staking arenas.";
    }

    const htmlContent = `
      <html>
        <head>
          <title>CogniSweep - Study Session Report</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1f2937; padding: 40px; line-height: 1.5; }
            .header { border-bottom: 2px solid #f97316; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
            .logo { font-size: 24px; font-weight: 900; color: #f97316; letter-spacing: 1px; }
            .title { font-size: 20px; font-weight: bold; margin: 0; }
            .meta-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 40px; }
            .card { background: #f9fafb; border: 1px solid #e5e7eb; padding: 20px; rounded: 8px; }
            .card-title { font-size: 11px; text-transform: uppercase; color: #6b7280; font-weight: bold; margin-bottom: 5px; }
            .card-val { font-size: 22px; font-weight: 800; color: #111827; }
            .table { w-full: 100%; width: 100%; border-collapse: collapse; margin: 30px 0; }
            .table th { background: #f3f4f6; text-align: left; padding: 10px; font-size: 12px; font-weight: bold; text-transform: uppercase; color: #4b5563; }
            .table td { padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
            .tips { background: #fff7ed; border-left: 4px solid #f97316; padding: 15px; border-radius: 4px; margin-top: 30px; }
            @media print {
              body { padding: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">COGNISWEEP</div>
            <div class="title">Session Report Log</div>
          </div>
          
          <div class="meta-grid">
            <div class="card">
              <div class="card-title">Room Target Details</div>
              <div class="card-val">${roomName} (${roomType.toUpperCase()})</div>
              <div style="font-size: 12px; color: #4b5563; margin-top: 5px;">Duration: ${durationMinutes} minutes</div>
            </div>
            <div class="card">
              <div class="card-title">Final Focus Performance</div>
              <div class="card-val" style="color: #10b981;">${focusScore} Points</div>
              <div style="font-size: 12px; color: #4b5563; margin-top: 5px;">Focus Efficiency Ratio: ${focusRatio.toFixed(1)}%</div>
            </div>
          </div>

          <h3 style="border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">Distraction Frequency Summary</h3>
          <table class="table">
            <thead>
              <tr>
                <th>Distraction Category</th>
                <th>Instance Count</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>👋 Hands Down / Elbow on Desk</td>
                <td>${distractionCounts['hand-down']}</td>
                <td style="color: ${distractionCounts['hand-down'] > 0 ? '#ef4444' : '#10b981'}; font-weight: bold;">
                  ${distractionCounts['hand-down'] > 0 ? 'Triggered' : 'Clean'}
                </td>
              </tr>
              <tr>
                <td>👀 Gaze-Away / Off-Screen Look</td>
                <td>${distractionCounts['gaze-away']}</td>
                <td style="color: ${distractionCounts['gaze-away'] > 0 ? '#ef4444' : '#10b981'}; font-weight: bold;">
                  ${distractionCounts['gaze-away'] > 0 ? 'Triggered' : 'Clean'}
                </td>
              </tr>
              <tr>
                <td>😴 Eye-Closed / Sleeping</td>
                <td>${distractionCounts['eye-closed']}</td>
                <td style="color: ${distractionCounts['eye-closed'] > 0 ? '#ef4444' : '#10b981'}; font-weight: bold;">
                  ${distractionCounts['eye-closed'] > 0 ? 'Triggered' : 'Clean'}
                </td>
              </tr>
              <tr>
                <td>👤 Face-Absent / Away</td>
                <td>${distractionCounts['face-absent']}</td>
                <td style="color: ${distractionCounts['face-absent'] > 0 ? '#ef4444' : '#10b981'}; font-weight: bold;">
                  ${distractionCounts['face-absent'] > 0 ? 'Triggered' : 'Clean'}
                </td>
              </tr>
              <tr>
                <td>📺 Static Frame Loop / Cheat Risk</td>
                <td>${distractionCounts['static-frame']}</td>
                <td style="color: ${distractionCounts['static-frame'] > 0 ? '#ef4444' : '#10b981'}; font-weight: bold;">
                  ${distractionCounts['static-frame'] > 0 ? 'Cheat Flagged' : 'Clean'}
                </td>
              </tr>
            </tbody>
          </table>

          <div class="tips">
            <strong style="color: #ea580c; font-size: 14px;">Personalized Feedback & Recommendations:</strong>
            <p style="margin: 5px 0 0 0; font-size: 13px; color: #4b5563;">${tips}</p>
          </div>

          <div style="margin-top: 50px; text-align: center; font-size: 10px; color: #9ca3af;">
            Generated automatically by CogniSweep Focus Analytics Engine.
          </div>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <button
      onClick={handlePrint}
      className="flex items-center justify-center gap-2 w-full lg:w-auto bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold font-mono px-4 py-2.5 rounded-lg border border-orange-400/50 shadow-md shadow-orange-500/20 transition uppercase tracking-wider"
    >
      <Download className="w-4 h-4" />
      <span>Download PDF Report</span>
    </button>
  );
}
