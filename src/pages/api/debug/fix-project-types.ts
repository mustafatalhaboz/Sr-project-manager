import { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@vercel/postgres';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Manual project type corrections
    const corrections = [
      { name: 'App', type: 'Mobil Uygulama' },
      { name: 'Hektas', type: 'E-ticaret' }, // You mentioned Hektas is e-commerce
      { name: 'Craftolia', type: 'E-ticaret' }, // Sounds like crafts/arts marketplace
      { name: 'Efor Takip', type: 'İş Takip Sistemi' }
    ];

    const results = [];

    for (const correction of corrections) {
      try {
        // Update project type
        const updateResult = await sql`
          UPDATE projects 
          SET 
            project_type = ${correction.type},
            last_analyzed = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
          WHERE name = ${correction.name}
        `;

        // Insert analysis record
        if (updateResult.rowCount > 0) {
          await sql`
            INSERT INTO project_analyses (
              project_id, task_count, ai_confidence, project_type_detected, tasks_analyzed
            )
            SELECT id, 0, 1.0, ${correction.type}, '[]'
            FROM projects 
            WHERE name = ${correction.name}
          `;
        }

        results.push({
          project: correction.name,
          newType: correction.type,
          updated: updateResult.rowCount > 0
        });

      } catch (error) {
        results.push({
          project: correction.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    res.status(200).json({ 
      success: true,
      results: results
    });

  } catch (error) {
    res.status(500).json({ 
      error: 'Fix failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}