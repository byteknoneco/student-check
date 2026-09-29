import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { DashboardData, Student } from '../types';

const esc = (value: unknown) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

function fmtDate(value?: string | null) {
  if (!value) return '-';
  try { return new Date(value).toLocaleDateString('tr-TR'); } catch { return '-'; }
}

export async function shareStudentReport(student: Student, data: DashboardData) {
  const lessons = data.lessons.filter(x => x.student_id === student.id).sort((a,b)=>+new Date(b.starts_at)-+new Date(a.starts_at));
  const completed = lessons.filter(x => x.status === 'completed');
  const homework = data.homework.filter(x => x.student_id === student.id);
  const exams = data.exams.filter(x => x.student_id === student.id).sort((a,b)=>+new Date(b.exam_date)-+new Date(a.exam_date));
  const progress = data.topicProgress.filter(x => x.student_id === student.id).sort((a,b)=>b.mastery_percent-a.mastery_percent);
  const goals = data.goals.filter(x => x.student_id === student.id);
  const pack = data.packages.find(x => x.student_id === student.id && x.active);
  const reviewed = homework.filter(x => x.status === 'reviewed').length;
  const submitted = homework.filter(x => x.status === 'submitted' || x.status === 'reviewed').length;
  const attendance = completed.length ? Math.round(completed.filter(x => x.attendance === 'present').length / completed.length * 100) : 0;
  const hwRate = homework.length ? Math.round(submitted / homework.length * 100) : 0;
  const reportDate = new Date().toLocaleDateString('tr-TR');

  const lessonRows = completed.slice(0, 12).map(x => `<tr><td>${fmtDate(x.starts_at)}</td><td>${esc(x.topic || '-')}</td><td>${esc(x.attendance || '-')}</td><td>${esc(x.teacher_note || '-')}</td></tr>`).join('');
  const examRows = exams.slice(0, 8).map(x => `<tr><td>${fmtDate(x.exam_date)}</td><td>${esc(x.title)}</td><td>${esc(x.subject_name)}</td><td><b>${esc(x.score)}/${esc(x.max_score)}</b></td></tr>`).join('');
  const topicRows = progress.slice(0, 10).map(x => `<div class="topic"><div><b>${esc(x.topic_name)}</b><small>${esc(x.subject_name)}</small></div><div class="pct">%${x.mastery_percent}</div></div>`).join('');
  const goalRows = goals.slice(0, 8).map(x => `<li>${esc(x.title)} - ${esc(x.current_value)}/${esc(x.target_value)}${x.completed ? ' (Tamamlandi)' : ''}</li>`).join('');

  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#1f2433;padding:28px;font-size:12px}h1{font-size:26px;margin:0}.brand{color:#5B5CE2;font-weight:800}.muted{color:#73798c}.header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #5B5CE2;padding-bottom:16px}.cards{display:flex;gap:10px;margin:18px 0}.card{flex:1;border:1px solid #e4e7ef;border-radius:10px;padding:12px}.big{font-size:22px;font-weight:800;margin-top:5px}.section{font-size:15px;font-weight:800;margin-top:22px;margin-bottom:8px}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:8px;border-bottom:1px solid #eceef4;vertical-align:top}th{font-size:10px;color:#73798c}.topic{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eceef4}.topic small{display:block;color:#73798c;margin-top:2px}.pct{font-size:16px;font-weight:800;color:#5B5CE2}.footer{margin-top:28px;color:#8b90a0;font-size:10px;text-align:center}</style></head><body>
    <div class="header"><div><div class="brand">DersTakip+</div><h1>${esc(student.full_name)}</h1><div class="muted">${esc(student.grade_level || '-')} / ${esc(student.school || '-')}</div></div><div class="muted">Gelisim raporu<br>${reportDate}</div></div>
    <div class="cards"><div class="card"><span class="muted">Tamamlanan ders</span><div class="big">${completed.length}</div></div><div class="card"><span class="muted">Katilim</span><div class="big">%${attendance}</div></div><div class="card"><span class="muted">Odev takibi</span><div class="big">%${hwRate}</div></div><div class="card"><span class="muted">Kalan paket</span><div class="big">${pack?.remaining_lessons ?? '-'}</div></div></div>
    <div class="section">Konu gelisimi</div>${topicRows || '<div class="muted">Konu gelisimi henuz girilmedi.</div>'}
    <div class="section">Son dersler</div><table><thead><tr><th>Tarih</th><th>Konu</th><th>Katilim</th><th>Ogretmen notu</th></tr></thead><tbody>${lessonRows || '<tr><td colspan="4">Tamamlanan ders yok.</td></tr>'}</tbody></table>
    <div class="section">Sinavlar</div><table><thead><tr><th>Tarih</th><th>Sinav</th><th>Ders</th><th>Sonuc</th></tr></thead><tbody>${examRows || '<tr><td colspan="4">Sinav sonucu yok.</td></tr>'}</tbody></table>
    <div class="section">Calisma hedefleri</div><ul>${goalRows || '<li>Aktif hedef yok.</li>'}</ul>
    <div class="footer">Bu rapor DersTakip+ tarafindan ${reportDate} tarihinde olusturuldu.</div>
  </body></html>`;

  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `${student.full_name} gelisim raporu` });
  }
  return uri;
}
