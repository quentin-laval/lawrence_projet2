#include "QtSerialCom.h"
#include <QtWidgets/QApplication>

int main(int argc, char *argv[])
{
    QApplication a(argc, argv);
    QtSerialCom w;
    w.show();
    return a.exec();
}
