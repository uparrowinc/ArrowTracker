import { sqliteDb } from "./db";
import * as fs from "fs";
import * as path from "path";

export class DataExportService {
  
  async exportToJSON(outputPath?: string): Promise<string> {
    try {
      const tables = this.getAllTables();
      const exportData: any = {};
      
      for (const table of tables) {
        const data = sqliteDb.prepare(`SELECT * FROM "${table}"`).all();
        exportData[table] = data;
      }
      
      const jsonData = JSON.stringify(exportData, null, 2);
      const filePath = outputPath || `./exports/data-export-${new Date().toISOString().split('T')[0]}.json`;
      
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(filePath, jsonData);
      return filePath;
    } catch (error) {
      throw new Error(`Export failed: ${error}`);
    }
  }
  
  async exportToCSV(outputDir?: string): Promise<string[]> {
    try {
      const tables = this.getAllTables();
      const exportedFiles: string[] = [];
      const baseDir = outputDir || './exports/csv';
      
      if (!fs.existsSync(baseDir)) {
        fs.mkdirSync(baseDir, { recursive: true });
      }
      
      for (const table of tables) {
        const data = sqliteDb.prepare(`SELECT * FROM "${table}"`).all() as Record<string, any>[];
        
        if (data.length > 0) {
          const headers = Object.keys(data[0]);
          let csvContent = headers.join(',') + '\n';
          
          for (const row of data) {
            const values = headers.map(header => {
              const value = row[header];
              if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`;
              }
              return value || '';
            });
            csvContent += values.join(',') + '\n';
          }
          
          const filePath = path.join(baseDir, `${table}-${new Date().toISOString().split('T')[0]}.csv`);
          fs.writeFileSync(filePath, csvContent);
          exportedFiles.push(filePath);
        }
      }
      
      return exportedFiles;
    } catch (error) {
      throw new Error(`CSV export failed: ${error}`);
    }
  }
  
  async exportToSQL(outputPath?: string): Promise<string> {
    try {
      const tables = this.getAllTables();
      let sqlDump = `-- Database export generated on ${new Date().toISOString()}\n\n`;
      
      for (const table of tables) {
        const data = sqliteDb.prepare(`SELECT * FROM "${table}"`).all() as Record<string, any>[];
        
        sqlDump += `-- Table: ${table}\n`;
        
        if (data.length > 0) {
          const headers = Object.keys(data[0]);
          
          for (const row of data) {
            const values = headers.map(header => {
              const value = row[header];
              if (value === null) return 'NULL';
              if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
              return value;
            });
            
            sqlDump += `INSERT INTO ${table} (${headers.join(', ')}) VALUES (${values.join(', ')});\n`;
          }
        }
        
        sqlDump += '\n';
      }
      
      const filePath = outputPath || `./exports/database-dump-${new Date().toISOString().split('T')[0]}.sql`;
      const dir = path.dirname(filePath);
      
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(filePath, sqlDump);
      return filePath;
    } catch (error) {
      throw new Error(`SQL export failed: ${error}`);
    }
  }
  
  private getAllTables(): string[] {
    const rows = sqliteDb.prepare(
      `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`
    ).all() as { name: string }[];
    return rows.map(row => row.name);
  }
  
  async scheduleExport(format: 'json' | 'csv' | 'sql' = 'json', intervalHours: number = 24) {
    const exportFunction = () => {
      console.log(`Starting scheduled ${format.toUpperCase()} export...`);
      
      switch (format) {
        case 'json':
          return this.exportToJSON();
        case 'csv':
          return this.exportToCSV();
        case 'sql':
          return this.exportToSQL();
      }
    };
    
    await exportFunction();
    
    setInterval(async () => {
      try {
        await exportFunction();
        console.log(`Scheduled ${format.toUpperCase()} export completed`);
      } catch (error) {
        console.error(`Scheduled export failed:`, error);
      }
    }, intervalHours * 60 * 60 * 1000);
  }
}

export const dataExporter = new DataExportService();
