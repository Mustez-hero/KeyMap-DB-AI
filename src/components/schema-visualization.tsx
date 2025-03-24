"use client"

interface TableColumn {
  name: string
  type?: string
  isPrimary?: boolean
  isForeign?: boolean
  reference?: string
}

interface TableSchema {
  name: string
  columns: TableColumn[]
}

interface SchemaVisualizationProps {
  tables: TableSchema[]
  className?: string
}

export default function SchemaVisualization({ tables, className = "" }: SchemaVisualizationProps) {
  if (!tables || tables.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 w-full border border-gray-200 text-center">
        <p className="text-gray-500 py-8">
          No schema information available yet. Ask a question about database design to generate a schema.
        </p>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg p-6 w-full max-w-[98vw] mx-auto shadow-sm border border-gray-200 ${className}`}>
      <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">Database Schema</h2>
      <div className="flex flex-nowrap overflow-x-auto gap-6 pb-4">
        {tables.map((table, tableIndex) => (
          <div key={tableIndex} className="flex-shrink-0 w-[280px]">
            <div className="font-bold text-lg mb-2 bg-gray-100 p-3 rounded-t-md border border-gray-300 border-b-0 flex items-center">
              <span className="text-blue-600 mr-2">📊</span>
              <span className="text-gray-800">{table.name}</span>
            </div>
            <div className="border border-gray-300 rounded-b-md overflow-hidden shadow-sm">
              {table.columns && table.columns.length > 0 ? (
                table.columns.map((column, columnIndex) => (
                  <div
                    key={columnIndex}
                    className={`px-4 py-3 flex items-center justify-between border-b last:border-b-0 border-gray-200 ${
                      columnIndex % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`}
                  >
                    <div className="font-medium flex items-center">
                      {column.isPrimary && <span className="mr-2 text-blue-600 text-xs">🔑</span>}
                      {column.isForeign && <span className="mr-2 text-green-600 text-xs">🔗</span>}
                      <span className={column.isPrimary ? "text-blue-600 font-semibold" : "text-black"}>
                        {column.name}
                      </span>
                      {column.isPrimary && (
                        <span className="text-xs ml-2 text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Primary</span>
                      )}
                      {column.isForeign && (
                        <span className="text-xs ml-2 text-green-600 bg-green-50 px-2 py-0.5 rounded">
                          → {column.reference}
                        </span>
                      )}
                    </div>
                    {column.type ? (
                      <div className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded font-mono">{column.type}</div>
                    ) : (
                      <div className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-600">field</div>
                    )}
                  </div>
                ))
              ) : (
                <div className="px-4 py-3 text-gray-500 text-center">No columns defined</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}