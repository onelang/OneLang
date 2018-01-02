use strict;
use warnings;

package TestClass;

sub new
{
    my $class = shift;
    my $self = {};
    bless $self, $class;
    return $self;
}

sub test_method {
    my ( $self ) = @_;
    my $x = "x";
    my $y = "y";
    
    my $z = "z";
    $z .= "Z";
    $z .= $x;
    
    my $a = (substr "abcdef", 2, (4 - 2));
    my $arr = split(" ", "ab  cd ef");
    
    return $z . "|" . $x . $y . "|" . $a . "|" . ${$arr}[2];
}

package Program;

eval {
    my $c = new TestClass();
    $c->test_method();
};
if ($@) {
    print "Exception: " . $@
}