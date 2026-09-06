import React, { useState } from 'react';
import { Button } from 'react-native-paper';
import { useAppColors, radius, spacing } from '../theme';
import { toCSV, downloadCSV, CsvColumn } from '../utils/csv';
import { appAlert } from './AppDialog';

interface Props {
  /** File name without extension. */
  filename: string;
  /** Called when pressed — return the rows to export. */
  rows: () => any[];
  columns?: CsvColumn[];
  label?: string;
  compact?: boolean;
}

const ExportButton: React.FC<Props> = ({
  filename,
  rows,
  columns,
  label = 'Export CSV',
  compact,
}) => {
  const c = useAppColors();
  const [busy, setBusy] = useState(false);

  const run = async () => {
    const data = rows() || [];
    if (data.length === 0) {
      appAlert('Nothing to export', 'There are no rows to put in the CSV yet.', 'info');
      return;
    }
    setBusy(true);
    try {
      const stamp = new Date().toISOString().slice(0, 10);
      await downloadCSV(`${filename}-${stamp}`, toCSV(data, columns));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      mode="outlined"
      icon="file-download-outline"
      compact={compact}
      loading={busy}
      disabled={busy}
      onPress={run}
      style={{ borderRadius: radius.md, borderColor: c.border }}
      contentStyle={{ height: 38, paddingHorizontal: spacing(2) }}
      labelStyle={{ fontSize: 12.5, fontWeight: '700' }}
      textColor={c.primary}
    >
      {label}
    </Button>
  );
};

export default ExportButton;
