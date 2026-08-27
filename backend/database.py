import sqlite3
import json
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "land_intelligence.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Create documents table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS documents (
            id TEXT PRIMARY KEY,
            filename TEXT,
            doc_type TEXT,
            raw_text TEXT,
            parsed_data TEXT, -- JSON string
            coordinates TEXT, -- JSON string [lat, lon]
            confidence_scores TEXT, -- JSON string
            fraud_report TEXT, -- JSON string
            nearby_amenities TEXT, -- JSON string
            quality_report TEXT, -- JSON string
            processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # 2. Create GIS parcels table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS gis_parcels (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            survey_no TEXT,
            subdivision TEXT,
            village TEXT,
            owner TEXT,
            classification TEXT,
            area TEXT,
            centroid TEXT, -- JSON string [lat, lon]
            geometry TEXT -- JSON string GeoJSON polygon coordinates list
        )
    """)
    
    # 3. Create Search History table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS search_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            query TEXT,
            searched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    conn.commit()
    conn.close()
    
    # Seed GIS parcels if empty
    seed_gis_parcels()

def seed_gis_parcels():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) FROM gis_parcels")
    if cursor.fetchone()[0] == 0:
        print("Seeding GIS survey database...")
        parcels = [
            {
                "survey_no": "142",
                "subdivision": "1A",
                "village": "Cuddalore Town",
                "owner": "Rajesh Kumar Sharma",
                "classification": "Dry Land",
                "area": "1.00 Acre",
                "centroid": [11.7401, 79.7590],
                "geometry": [
                    [11.742, 79.757], [11.742, 79.759],
                    [11.739, 79.759], [11.739, 79.757],
                    [11.742, 79.757]
                ]
            },
            {
                "survey_no": "142",
                "subdivision": "1B",
                "village": "Cuddalore Town",
                "owner": "Rajesh Kumar Sharma",
                "classification": "Dry Land",
                "area": "1.50 Acres",
                "centroid": [11.7380, 79.7610],
                "geometry": [
                    [11.739, 79.759], [11.739, 79.762],
                    [11.736, 79.762], [11.736, 79.759],
                    [11.739, 79.759]
                ]
            },
            {
                "survey_no": "SY/142/A",
                "subdivision": "1A",
                "village": "Khandala, Pune",
                "owner": "Rajesh Kumar Sharma",
                "classification": "Non-Agricultural (Residential)",
                "area": "1.5 Acres",
                "centroid": [18.7667, 73.3833],
                "geometry": [
                    [18.768, 73.381], [18.768, 73.384],
                    [18.765, 73.384], [18.765, 73.381],
                    [18.768, 73.381]
                ]
            },
            {
                "survey_no": "SY/142/A",
                "subdivision": "1B",
                "village": "Khandala, Pune",
                "owner": "Rajesh Kumar Sharma",
                "classification": "Non-Agricultural (Residential)",
                "area": "1.0 Acres",
                "centroid": [18.7645, 73.3855],
                "geometry": [
                    [18.765, 73.384], [18.765, 73.387],
                    [18.762, 73.387], [18.762, 73.384],
                    [18.765, 73.384]
                ]
            },
            {
                "survey_no": "319",
                "subdivision": "4",
                "village": "Perambalur",
                "owner": "Suresh Kumar Selvam",
                "classification": "Wet Land (Agricultural)",
                "area": "2.2 Acres",
                "centroid": [11.2333, 78.8667],
                "geometry": [
                    [11.235, 78.864], [11.235, 78.868],
                    [11.231, 78.868], [11.231, 78.864],
                    [11.235, 78.864]
                ]
            }
        ]
        
        for p in parcels:
            cursor.execute("""
                INSERT INTO gis_parcels (survey_no, subdivision, village, owner, classification, area, centroid, geometry)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                p["survey_no"],
                p["subdivision"],
                p["village"],
                p["owner"],
                p["classification"],
                p["area"],
                json.dumps(p["centroid"]),
                json.dumps(p["geometry"])
            ))
        conn.commit()
    conn.close()

def add_document(doc_id, filename, doc_type, raw_text, parsed_data, coordinates, confidence_scores, fraud_report, nearby_amenities, quality_report):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT OR REPLACE INTO documents (id, filename, doc_type, raw_text, parsed_data, coordinates, confidence_scores, fraud_report, nearby_amenities, quality_report)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        doc_id,
        filename,
        doc_type,
        raw_text,
        json.dumps(parsed_data),
        json.dumps(coordinates),
        json.dumps(confidence_scores),
        json.dumps(fraud_report),
        json.dumps(nearby_amenities),
        json.dumps(quality_report)
    ))
    conn.commit()
    conn.close()

def get_documents():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM documents ORDER BY processed_at DESC")
    rows = cursor.fetchall()
    conn.close()
    
    docs = []
    for r in rows:
        docs.append({
            "id": r["id"],
            "filename": r["filename"],
            "doc_type": r["doc_type"],
            "raw_text": r["raw_text"],
            "parsed_data": json.loads(r["parsed_data"]),
            "coordinates": json.loads(r["coordinates"]),
            "confidence_scores": json.loads(r["confidence_scores"]),
            "fraud_report": json.loads(r["fraud_report"]),
            "nearby_amenities": json.loads(r["nearby_amenities"]),
            "quality_report": json.loads(r["quality_report"]),
            "processed_at": r["processed_at"]
        })
    return docs

def get_document_by_id(doc_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM documents WHERE id = ?", (doc_id,))
    r = cursor.fetchone()
    conn.close()
    
    if r is None:
        return None
        
    return {
        "id": r["id"],
        "filename": r["filename"],
        "doc_type": r["doc_type"],
        "raw_text": r["raw_text"],
        "parsed_data": json.loads(r["parsed_data"]),
        "coordinates": json.loads(r["coordinates"]),
        "confidence_scores": json.loads(r["confidence_scores"]),
        "fraud_report": json.loads(r["fraud_report"]),
        "nearby_amenities": json.loads(r["nearby_amenities"]),
        "quality_report": json.loads(r["quality_report"]),
        "processed_at": r["processed_at"]
    }

def query_gis_parcel(survey_no, subdivision=None, village=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Try direct survey number query
    query = "SELECT * FROM gis_parcels WHERE survey_no = ?"
    params = [survey_no]
    
    # If subdivision is provided, do a robust check
    if subdivision:
        # subdivision could match exactly or clean subdivision e.g. 1A -> 1A or 1
        query += " AND (subdivision = ? OR subdivision LIKE ?)"
        params.extend([subdivision, f"%{subdivision}%"])
        
    if village:
        # Check if village matches
        clean_village = village.split(",")[0].strip()
        query += " AND village LIKE ?"
        params.append(f"%{clean_village}%")
        
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    if not rows and subdivision:
        # Fallback to check just survey number and village
        return query_gis_parcel(survey_no, subdivision=None, village=village)
        
    parcels = []
    for r in rows:
        parcels.append({
            "id": r["id"],
            "survey_no": r["survey_no"],
            "subdivision": r["subdivision"],
            "village": r["village"],
            "owner": r["owner"],
            "classification": r["classification"],
            "area": r["area"],
            "centroid": json.loads(r["centroid"]),
            "geometry": json.loads(r["geometry"])
        })
    return parcels

def add_search_history(query):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO search_history (query) VALUES (?)", (query,))
    conn.commit()
    conn.close()

def get_search_history():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT query, count(query) as cnt, max(searched_at) as last_searched FROM search_history GROUP BY query ORDER BY last_searched DESC LIMIT 10")
    rows = cursor.fetchall()
    conn.close()
    return [{"query": r["query"], "cnt": r["cnt"], "last_searched": r["last_searched"]} for r in rows]

if __name__ == "__main__":
    init_db()
    print("Database initiated successfully.")
