import React, { useEffect, useState } from "react";
import mondaySdk from "monday-sdk-js";

const monday = mondaySdk();

export default function App() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    monday.listen("context", (res) => {
      const boardId = res?.data?.boardId;
      if (boardId) loadProjects(boardId);
    });
  }, []);

  async function loadProjects(boardId) {
    try {
      setLoading(true);
      setError("");

      const query = `
        query {
          boards(ids: [${boardId}]) {
            items_page(limit: 100) {
              items {
                id
                name
                group { title }
                updated_at
                column_values { id text value }
                updates(limit: 10) {
                  id
                  text_body
                  created_at
                  creator { name }
                  assets { id name url }
                }
                subitems {
                  id
                  name
                  column_values { id text value }
                }
              }
            }
          }
        }
      `;

      const res = await monday.api(query);
      const items = res?.data?.boards?.[0]?.items_page?.items || [];

      const mapped = items
        .filter((item) => item.group?.title === "PROJE")
        .map((item) => {
          const columns = {};
          item.column_values?.forEach((c) => {
            columns[c.id] = c.text;
          });

          return {
            id: item.id,
            name: item.name,
            status: columns.durum || columns.status || "",
            notes: columns.notlar || columns.notes || "",
            location: columns.konumProjeAd || columns.location || "",
            updatedAt: item.updated_at,
            updates: item.updates || [],
            subitems: item.subitems || [],
          };
        });

      setProjects(mapped);
    } catch (err) {
      console.error(err);
      setError(err.message || "Projektinformationen konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="page">Projeler yükleniyor...</div>;
  }

  if (error) {
    return (
      <div className="page">
        <div className="empty">
          <h2>Hata</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="header">
        <h1>DAIMA ENERJİ & YÜKSEL MÜHENDİSLİK</h1>
        <p>1981&apos;den bu yana daima yanınızdayız!</p>
      </header>

      <section className="report-title">
        <h2>Müşteri Raporu</h2>
        <p>PROJE grubundaki canlı proje bilgileri</p>
      </section>

      <section className="stats">
        <div className="stat"><span>Toplam</span><strong>{projects.length}</strong></div>
        <div className="stat"><span>Devam Ediyor</span><strong>{projects.filter(p => p.status === "Devam Ediyor").length}</strong></div>
        <div className="stat"><span>Tamamlandı</span><strong>{projects.filter(p => p.status === "Tamamlandı").length}</strong></div>
        <div className="stat"><span>Beklemede</span><strong>{projects.filter(p => p.status === "Beklemede").length}</strong></div>
      </section>

      {projects.length === 0 ? (
        <div className="empty">PROJE grubunda gösterilecek içerik bulunmuyor.</div>
      ) : (
        <div className="list">
          {projects.map((project) => (
            <article className="card" key={project.id}>
              <div className="card-top">
                <h3>{project.name}</h3>
                {project.status && <span className="badge">{project.status}</span>}
              </div>

              {project.location && <p className="meta">📍 {project.location}</p>}
              {project.notes && <p className="notes">{project.notes}</p>}

              {project.updates?.length > 0 && (
                <div className="section">
                  <h4>Güncellemeler ({project.updates.length})</h4>
                  {project.updates.map((update) => (
                    <div className="update" key={update.id}>
                      <div className="update-head">
                        <strong>{update.creator?.name || "Bilinmeyen"}</strong>
                        <span>{new Date(update.created_at).toLocaleDateString("tr-TR")}</span>
                      </div>
                      <p>{update.text_body}</p>
                    </div>
                  ))}
                </div>
              )}

              {project.subitems?.length > 0 && (
                <div className="section">
                  <h4>Alt Görevler ({project.subitems.length})</h4>
                  {project.subitems.map((subitem) => (
                    <div className="subitem" key={subitem.id}>{subitem.name}</div>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
