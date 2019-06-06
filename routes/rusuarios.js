module.exports = function(app, swig, gestorBD) {
    app.get("/usuarios", function (req, res) {
        res.send("ver usuarios");
    });

    app.get("/registrarse", function (req, res) {
        var respuesta = swig.renderFile('views/bregistro.html', {});
        res.send(respuesta);
    });



    app.post('/usuario', function (req, res) {
        var criterio = {"email": req.body.email};
        if (req.body.password != req.body.confirmpassword)
            res.redirect("/registrarse?mensaje=Las passwords no coinciden");
        else {
            gestorBD.obtenerUsuarios(criterio, function (usuarios) {
                if (usuarios.length >= 1)
                    res.redirect("/registrarse?mensaje=Email ya en uso");
                else {
                    var seguro = app.get("crypto").createHmac('sha256', app.get('clave'))
                        .update(req.body.password).digest('hex');
                    var usuario = {
                        name: req.body.name,
                        surname: req.body.surname,
                        email: req.body.email,
                        password: seguro,
                        money: 100
                    }

                    gestorBD.insertarUsuario(usuario, function (id) {
                        if (id == null) {
                            res.redirect("/registrarse?mensaje=Error al registrar usuario");

                        } else {
                            res.redirect("/identificarse?mensaje=Nuevo usuario registrado");

                        }
                    });
                }

            });
        }
    });


    app.get('/compras', function (req, res) {
        var criterio = {"vendida": req.session.usuario};
        gestorBD.obtenerCompras(criterio, function (compras) {
            if (compras == null) {
                res.send("Error al listar ");
            } else {
                    var respuesta = swig.renderFile('views/bcompras2.html',
                        {
                            ofertas: compras
                        });
                    res.send(respuesta);
            }
        });
    })


    app.get("/identificarse", function (req, res) {
        var respuesta = swig.renderFile('views/bidentificacion.html', {});
        res.send(respuesta);
    });

    app.get("/desconectarse", function (req, res) {
        req.session.usuario = null;
        res.redirect("/identificarse" +
            "?mensaje=Se ha desconectado correctamente");
    });

    app.post("/identificarse", function (req, res) {
        var seguro = app.get("crypto").createHmac('sha256', app.get('clave'))
            .update(req.body.password).digest('hex');
        var criterio = {
            email: req.body.email,
            password: seguro
        }
        gestorBD.obtenerUsuarios(criterio, function (usuarios) {
            if (usuarios == null || usuarios.length == 0) {
                req.session.usuario = null;
                res.redirect("/identificarse" +
                    "?mensaje=Email o password incorrecto" +
                    "&tipoMensaje=alert-danger ");

            } else {
                req.session.usuario = usuarios[0].email;
                if (usuarios[0].email == app.get('adminEmail'))
                    res.redirect("/vistaAdministrador");
                else
                    res.redirect("/vistaUsuario");
            }
        });

    });

    app.get('/vistaAdministrador', function (req, res) {
        if (req.session.usuario != app.get('adminEmail'))
            res.redirect("/identificarse" +
                "?mensaje=Necesitas identificarte como administrador para acceder a este recurso" +
                "&tipoMensaje=alert-danger ");
        else {
            var respuesta = swig.renderFile('views/vistaAdministrador.html', {});
            res.send(respuesta);
        }
    });

    app.get('/vistaUsuario', function (req, res) {
        if (req.session.usuario == app.get('adminEmail'))
            res.redirect("/identificarse" +
                "?mensaje=Necesitas identificarte como usuario estándar para acceder a este recurso" +
                "&tipoMensaje=alert-danger ");
        else {
            var respuesta = swig.renderFile('views/vistaUsuario.html', {});
            res.send(respuesta);
        }
    });

    app.get("/listarUsuarios", function(req, res) {
        var criterio = { email : { $ne: req.session.usuario} };
        gestorBD.obtenerUsuarios(criterio,function(usuarios) {
            if (usuarios == null) {
                res.send("Error al listar ");
            } else {
                var respuesta = swig.renderFile('views/listarUsuarios.html',
                    {
                        usuarios : usuarios
                    });
                res.send(respuesta);
            }
        });
    });

    app.post('/admin/eliminarUsuarios', function (req, res) {
        var usersToDel = req.body.toDelete;

        if (usersToDel == null) {
            res.redirect("/listarUsuarios" +
                "?mensaje=No se eliminó ningún usuario" +
                "&tipoMensaje=alert-danger ");
        }
        else {
            if (!Array.isArray(usersToDel)) {
                var aux = usersToDel;
                usersToDel = [];
                usersToDel.push(aux);
            }

            var criterio = {email: {$in: usersToDel} };
            console.log(criterio.toString());

            gestorBD.eliminarUsuarios(criterio, function (result) {
                if (result == null || result < 1) {
                    res.redirect("/listarUsuarios" +
                        "?mensaje=Los usuarios no fueron eliminados");
                } else {
                    res.redirect("/listarUsuarios");
                }

            });
        }

    });

    app.get('/desconectarse', function (req, res) {
        req.session.usuario = null;
        res.send("Usuario desconectado");
    });


};