args=("$@")
res=$(grep "@" ${args[0]} | cut -d= -f7 | sort | uniq -c)
echo $res
exit 0