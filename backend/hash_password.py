import bcrypt

password = "admin123"

hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt())

print(hashed.decode())



# $2b$12$mfNn.F61RlfzvEYryP6wQOp/SI6nJVkottTPiSNfOnOQsW0jEPBQm

password2="operator123"

hashed = bcrypt.hashpw(password2.encode(), bcrypt.gensalt())

print(hashed.decode())

# $2b$12$7sAQTWB7H1fm5qnHhI.I5O5oYhudX2hrDbBIzzfGxRUgCEWNigUJ.

password3="deliveryrider123"

hashed = bcrypt.hashpw(password3.encode(), bcrypt.gensalt())

print(hashed.decode())

# $2b$12$U2Nm945YysZpqTFIuYZKS.tMdcLDa0EFKeGrqDZiexDmREn/Sj8Su