import React from 'react';
import { Rect, Text } from 'react-konva';

const TableCore = ({ posicion = { x: 0, y: 0 }, dimensiones = { ancho: 40, alto: 40 }, nombre }) => {
  return (
    <>
      <Rect x={posicion.x} y={posicion.y} width={dimensiones.ancho} height={dimensiones.alto} fill="#ddd" stroke="black" strokeWidth={1} />
      {nombre && <Text x={posicion.x + 6} y={posicion.y + 6} text={nombre} fontSize={12} fill="black" />}
    </>
  );
};

export default TableCore;
