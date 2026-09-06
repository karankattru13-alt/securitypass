import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
// Import only the matrix builder to avoid pulling in qrcode's PNG renderer
// (which needs node's zlib/pngjs and breaks Metro bundling).
// eslint-disable-next-line @typescript-eslint/no-var-requires
const QRCodeCore = require('qrcode/lib/core/qrcode');
import { colors } from '../theme';

interface Props {
  value: string;
  size?: number;
}

/**
 * Lightweight QR renderer: `qrcode` builds the module matrix (pure JS, no native
 * deps) and we paint it with react-native-svg so it works on web and native.
 */
const QRView: React.FC<Props> = ({ value, size = 200 }) => {
  const matrix = useMemo(() => {
    try {
      const qr = QRCodeCore.create(value, { errorCorrectionLevel: 'M' });
      const count: number = qr.modules.size;
      const data: any = qr.modules.data;
      const rows: boolean[][] = [];
      for (let r = 0; r < count; r++) {
        const row: boolean[] = [];
        for (let c = 0; c < count; c++) row.push(!!data[r * count + c]);
        rows.push(row);
      }
      return rows;
    } catch {
      return null;
    }
  }, [value]);

  if (!matrix) {
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: colors.danger }}>Invalid QR data</Text>
      </View>
    );
  }

  const count = matrix.length;
  const cell = size / count;

  return (
    <Svg width={size} height={size}>
      <Rect x={0} y={0} width={size} height={size} fill="#fff" />
      {matrix.map((row, r) =>
        row.map((on, c) =>
          on ? (
            <Rect
              key={`${r}-${c}`}
              x={c * cell}
              y={r * cell}
              width={cell + 0.5}
              height={cell + 0.5}
              fill="#000"
            />
          ) : null
        )
      )}
    </Svg>
  );
};

export default QRView;
