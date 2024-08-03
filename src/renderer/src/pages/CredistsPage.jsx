import React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import CardActions from '@mui/material/CardActions';
import Button from '@mui/material/Button';

const InfoCard = () => {
  return (
    <Card sx={{ maxWidth: 800, margin: '20px auto' }}>
      <CardContent>
        <Typography variant="h5" component="div" gutterBottom>
          Bienvenidos
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Esta es una versión temprana de la aplicación, por lo que podría presentar algunos errores. Si observas algún mal funcionamiento o tienes ideas para mejorarla, por favor envía un correo a <strong>gustavogarrido.programador@gmail.com</strong>.
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Mi idea es seguir mejorando la aplicación para contribuir al arte del píxel, del cual también soy un fanático.
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          La aplicación será de código abierto y gratuita para todo el público.
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Saludos, Gustavo Garrido
        </Typography>
      </CardContent>
    </Card>
  );
};

export default InfoCard;
