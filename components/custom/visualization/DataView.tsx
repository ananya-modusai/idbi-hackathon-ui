import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { VisualizationData } from "./types";

interface DataViewProps {
  data: VisualizationData[];
}

export function DataView({ data }: DataViewProps) {
  if (!data.length) return null;

  const columns = Object.keys(data[0]);

  return (
    <div className="overflow-auto max-h-[300px] w-full">
      <div className="min-w-full overflow-x-auto">
        <Table className="w-full table-fixed">
          <TableHeader>
            <TableRow>
              {columns.map((key) => (
                <TableHead key={key} className="whitespace-nowrap">{key}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, i) => (
              <TableRow key={i}>
                {columns.map((key) => (
                  <TableCell key={key} className="whitespace-nowrap overflow-hidden text-ellipsis">
                    {String(row[key])}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 