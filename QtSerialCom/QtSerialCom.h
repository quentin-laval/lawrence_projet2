#pragma once

#include <QtWidgets/QMainWindow>
#include "ui_QtSerialCom.h"
#include <qserialport.h>
#include "QtSerialCom.h"
#include <QSerialPortInfo>
#include <qsqldatabase.h>
class QtSerialCom : public QMainWindow
{
    Q_OBJECT

public:
    QtSerialCom(QWidget *parent = nullptr);
    ~QtSerialCom();

    

    

private:
    Ui::QtSerialComClass ui;
    QSerialPort* port;
    QSqlDatabase db;

public slots:
    void OpenPort();

   void onSerialPortReadyRead();
   void decodeGPSFrame(const QString& frameStr);
   double convertToDecimalDegrees(const QString& value, const QString& direction);
   void ConnectToDatabase();
   void InsertCoordinates(double latitude, double longitude);
   
};
