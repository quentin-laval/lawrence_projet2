#include "QtSerialCom.h"
#include <QSerialPortInfo>
#include <qdebug.h>
#include "sql.h"

QtSerialCom::QtSerialCom(QWidget* parent)
    : QMainWindow(parent)
{
    ui.setupUi(this);

    QList<QSerialPortInfo> availablePorts = QSerialPortInfo::availablePorts();
    for (int i = 0; i < availablePorts.size(); i++) {
        QSerialPortInfo info = availablePorts[i];
        ui.comboBox->addItem(info.portName(), QVariant(info.portName()));
    }
}

QtSerialCom::~QtSerialCom()
{}

void QtSerialCom::OpenPort() {
    ConnectToDatabase();
    if (ui.comboBox->currentIndex() >= 0)
    {
        port = new QSerialPort(ui.comboBox->currentText());
        QObject::connect(port, SIGNAL(readyRead()), this, SLOT(onSerialPortReadyRead()));
        port->setBaudRate(9600);
        port->setDataBits(QSerialPort::DataBits::Data8);
        port->setParity(QSerialPort::Parity::NoParity);
        port->setStopBits(QSerialPort::StopBits::OneStop);
        if (port->open(QIODevice::OpenModeFlag::ExistingOnly | QIODevice::OpenModeFlag::ReadWrite))
        {
            ui.TextBox->appendPlainText("Status port : Ouvert");
        }
    }
}

void QtSerialCom::onSerialPortReadyRead()
{
    static QByteArray buffer;

    buffer.append(port->readAll());

    while (buffer.contains('$') && buffer.contains("\r\n")) {
        int startIndex = buffer.indexOf('$');
        int endIndex = buffer.indexOf("\r\n", startIndex);

        if (endIndex != -1) {
            QByteArray completeFrame = buffer.mid(startIndex, endIndex - startIndex + 2);

            buffer.remove(0, endIndex + 2);

            QString frameStr(completeFrame);
            ui.TextBox->appendPlainText(frameStr);

            if (frameStr.startsWith("$GPGGA") || frameStr.startsWith("$GPRMC")) {
                decodeGPSFrame(frameStr);
            }
        }
    }
}

void QtSerialCom::decodeGPSFrame(const QString& frameStr)
{
    static double latitude = 0.0;
    static double longitude = 0.0;

    QStringList fields = frameStr.split(',');

    if (fields[0] == "$GPGGA" || fields[0] == "$GPRMC") {
        if (fields.size() > 5) {

            QString latValue = fields[2];
            QString latDirection = fields[3];

            QString lonValue = fields[4];
            QString lonDirection = fields[5];

            latitude = convertToDecimalDegrees(latValue, latDirection);
            longitude = convertToDecimalDegrees(lonValue, lonDirection);

            ui.TextBox->appendPlainText(
                QString("Latitude: %1, Longitude: %2")
                .arg(latitude)
                .arg(longitude)
            );

            // Insert coordinates into the database
            InsertCoordinates(latitude, longitude);
        }
    }
}

double QtSerialCom::convertToDecimalDegrees(const QString& value, const QString& direction)
{
    if (value.isEmpty() || direction.isEmpty()) {
        return 0.0;
    }

    double degrees = value.left(value.indexOf('.') - 2).toDouble();
    double minutes = value.mid(value.indexOf('.') - 2).toDouble();
    double decimalDegrees = degrees + (minutes / 60.0);

    if (direction == "S" || direction == "W") {
        decimalDegrees = -decimalDegrees;
    }

    return decimalDegrees;
}

void QtSerialCom::ConnectToDatabase()
{
    db = QSqlDatabase::addDatabase("QMYSQL");
    db.setHostName("192.168.64.187");
    db.setDatabaseName("Lawrence");
    db.setUserName("LRC");
    db.setPassword("lrc");

    if (db.open())
    {
        qDebug() << "Connexion réussie";
        ui.TextBox->appendPlainText("Connexion a la BDD réussie");
    }
    else
    {
        qDebug() << "Connexion échouée: " << db.lastError().text(); 
        ui.TextBox->appendPlainText("Connexion a la BDD raté : " + db.lastError().text());
    }
}
